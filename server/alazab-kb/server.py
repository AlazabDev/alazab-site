"""Alazab Knowledge Base — unauthenticated, public MCP and REST endpoints."""
import os, re, json
from contextlib import contextmanager
from typing import Literal
from mcp.server import MCPServer
from mcp.server.transport_security import TransportSecuritySettings
from starlette.requests import Request
from starlette.responses import JSONResponse
from psycopg import connect
from psycopg.rows import dict_row

DATABASE_URL = os.environ['AZ_KB_DATABASE_URL']
PUBLIC_HOST = os.environ.get('AZ_KB_PUBLIC_HOST','kb.alazab.com')
mcp = MCPServer('Alazab Knowledge Base', instructions='Public project specifications, authoritative decisions, reference documents, and version history. Always distinguish approved from draft. No authentication required.')

@contextmanager
def db():
    with connect(DATABASE_URL, row_factory=dict_row) as conn:
        yield conn

def normalized_slug(slug):
    slug = str(slug).strip().lower()
    if not re.fullmatch(r'[a-z0-9][a-z0-9_-]{1,127}',slug):
        raise ValueError('slug must be 2-128 characters: lowercase English letters, digits, underscore, hyphen')
    return slug

def list_records(query='',project='',status='',limit=20):
    limit=max(1,min(int(limit),100))
    query=(query or '').strip()
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute('''SELECT id,slug,title,project,category,status,revision,source,updated_at,
            CASE WHEN %(q)s = '' THEN 0 ELSE ts_rank(search_vector,plainto_tsquery('simple',%(q)s)) END AS rank
            FROM az_kb.documents
            WHERE (%(p)s = '' OR project=%(p)s)
            AND (%(s)s = '' OR status=%(s)s)
            AND (%(q)s = '' OR search_vector @@ plainto_tsquery('simple',%(q)s)
                OR title ILIKE '%%'||%(q)s||'%%' OR content ILIKE '%%'||%(q)s||'%%')
            ORDER BY rank DESC, updated_at DESC LIMIT %(n)s''',{'q':query,'p':project,'s':status,'n':limit})
            return cur.fetchall()

def read_record(slug,revision=0):
    slug=normalized_slug(slug)
    with db() as conn:
        with conn.cursor() as cur:
            if revision:
                cur.execute('''SELECT d.slug,d.project,d.category,r.revision,r.title,r.content,r.status,r.source,r.changed_at
                     FROM az_kb.documents d JOIN az_kb.revisions r ON d.id=r.document_id
                     WHERE d.slug=%s AND r.revision=%s''',(slug,revision))
            else:
                cur.execute('SELECT id,slug,title,project,category,status,content,source,revision,created_at,updated_at FROM az_kb.documents WHERE slug=%s',(slug,))
            return cur.fetchone()

def save_record(slug,title,content,project='general',category='reference',status='draft',source='',expected_revision=0):
    slug=normalized_slug(slug)
    if status not in ('draft','approved','superseded'): raise ValueError('invalid status')
    if not title.strip() or not content.strip(): raise ValueError('title and content are required')
    with db() as conn:
        with conn.cursor() as cur:
            # One writer per slug: transaction-level advisory lock handles concurrent new inserts.
            cur.execute('SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))',(slug,))
            cur.execute('SELECT id,revision FROM az_kb.documents WHERE slug=%s FOR UPDATE',(slug,))
            existing=cur.fetchone()
            if existing:
                if expected_revision and expected_revision != existing['revision']:
                    raise ValueError(f"revision_conflict: current revision {existing['revision']}")
                revision=existing['revision']+1
                cur.execute('''UPDATE az_kb.documents SET title=%s,content=%s,project=%s,category=%s,status=%s,source=%s,revision=%s,updated_at=now()
                         WHERE id=%s RETURNING id''',(title,content,project,category,status,source,revision,existing['id']))
                doc_id=cur.fetchone()['id']
            else:
                if expected_revision: raise ValueError('revision_conflict: document does not exist')
                revision=1
                cur.execute('''INSERT INTO az_kb.documents(slug,title,content,project,category,status,source) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id''',
                            (slug,title,content,project,category,status,source))
                doc_id=cur.fetchone()['id']
            cur.execute('''INSERT INTO az_kb.revisions(document_id,revision,title,content,status,source) VALUES(%s,%s,%s,%s,%s,%s)''',
                        (doc_id,revision,title,content,status,source))
        conn.commit()
    return {'slug':slug,'revision':revision,'status':status}

def revision_list(slug):
    slug=normalized_slug(slug)
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute('''SELECT r.revision,r.title,r.status,r.source,r.changed_at FROM az_kb.revisions r JOIN az_kb.documents d ON d.id=r.document_id WHERE d.slug=%s ORDER BY r.revision DESC''',(slug,))
            return cur.fetchall()

@mcp.tool()
def knowledge_search(query: str='',project: str='',status: str='',limit:int=20) -> str:
    """Search project knowledge and canonical decisions. Filter status=approved for authoritative entries."""
    return json.dumps(list_records(query,project,status,limit),default=str,ensure_ascii=False)

@mcp.tool()
def knowledge_get(slug:str,revision:int=0) -> str:
    """Read a knowledge entry or historical revision by slug."""
    return json.dumps(read_record(slug,revision),default=str,ensure_ascii=False)

@mcp.tool()
def knowledge_save(slug:str,title:str,content:str,project:str='general',category:str='reference',status:Literal['draft','approved','superseded']='draft',source:str='',expected_revision:int=0) -> str:
    """Public write: create/update an entry; revision history is immutable. expected_revision supports conflict detection."""
    return json.dumps(save_record(slug,title,content,project,category,status,source,expected_revision),ensure_ascii=False)

@mcp.tool()
def knowledge_history(slug:str) -> str:
    """Show immutable revision history for an entry."""
    return json.dumps(revision_list(slug),default=str,ensure_ascii=False)

@mcp.custom_route('/health', methods=['GET'])
async def health(request:Request):
    try:
        with db() as conn:
            conn.execute('SELECT 1')
        return JSONResponse({'status':'ok','service':'alazab-kb','public':True})
    except Exception:
        return JSONResponse({'status':'database_unavailable'},status_code=503)

@mcp.custom_route('/api/search', methods=['GET'])
async def search_api(request:Request):
    q=request.query_params
    try:
        return JSONResponse(json.loads(json.dumps(list_records(q.get('q',''),q.get('project',''),q.get('status',''),q.get('limit','20')),default=str)))
    except Exception as e:
        return JSONResponse({'error':str(e)},status_code=400)

@mcp.custom_route('/api/documents/{slug}', methods=['GET'])
async def get_api(request:Request):
    try:
        return JSONResponse(json.loads(json.dumps(read_record(request.path_params['slug']),default=str)))
    except Exception as e:
        return JSONResponse({'error':str(e)},status_code=400)

@mcp.custom_route('/api/documents', methods=['POST'])
async def save_api(request:Request):
    try:
        data=await request.json()
        result=save_record(**data)
        return JSONResponse(result)
    except (TypeError,ValueError,KeyError) as e:
        return JSONResponse({'error':str(e)},status_code=400)

# Public-access by design: allowed Host/Origin is transport validation, not account authentication.
security=TransportSecuritySettings(allowed_hosts=[PUBLIC_HOST, PUBLIC_HOST+':*','127.0.0.1:*','localhost:*'],allowed_origins=['https://'+PUBLIC_HOST])
app=mcp.streamable_http_app(transport_security=security,stateless_http=True,json_response=True)
