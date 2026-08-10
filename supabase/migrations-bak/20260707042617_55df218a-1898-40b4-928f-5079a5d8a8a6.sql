
REVOKE SELECT (author_email) ON public.project_comments FROM anon;
REVOKE SELECT (reviewer_email, reviewer_phone) ON public.project_reviews FROM anon;

