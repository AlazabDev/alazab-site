import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchProjectNotesBoard,
  updateProjectNote,
  uploadProjectNoteAttachment,
} from '@/lib/projectNotes';
import type { ProjectNotesBoard } from '@/types/projectNotes';

interface ProjectNoteCompletionCameraProps {
  projectId: string;
  onCompleted?: () => void;
}

const emptyBoard: ProjectNotesBoard = { sections: [], notes: [] };

const createCompletionFile = (file: File, noteId: string): File => {
  const mimeExtensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  const originalExtension = file.name.includes('.')
    ? file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    : '';
  const extension = mimeExtensions[file.type] || originalExtension || 'jpg';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return new File(
    [file],
    `completion-${noteId.slice(0, 8)}-${timestamp}.${extension}`,
    { type: file.type || 'image/jpeg', lastModified: Date.now() },
  );
};

const ProjectNoteCompletionCamera: React.FC<ProjectNoteCompletionCameraProps> = ({
  projectId,
  onCompleted,
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [board, setBoard] = useState<ProjectNotesBoard>(emptyBoard);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableNotes = useMemo(
    () => board.notes.filter((note) => note.status !== 'cancelled'),
    [board.notes],
  );

  const selectedNote = useMemo(
    () => availableNotes.find((note) => note.id === selectedNoteId) || null,
    [availableNotes, selectedNoteId],
  );

  const loadNotes = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const nextBoard = await fetchProjectNotesBoard(projectId);
      setBoard(nextBoard);
      setSelectedNoteId((current) => {
        if (nextBoard.notes.some((note) => note.id === current)) return current;
        return (
          nextBoard.notes.find((note) => note.status !== 'done' && note.status !== 'cancelled')?.id ||
          nextBoard.notes.find((note) => note.status !== 'cancelled')?.id ||
          ''
        );
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الملاحظات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes();
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearSelectedImage = (): void => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleImageSelected = (file: File | undefined): void => {
    setMessage(null);
    setError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('اختر صورة فقط');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleComplete = async (): Promise<void> => {
    if (!selectedNote || !selectedFile) {
      setError('اختر الملاحظة والتقط صورة أولًا');
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const completionFile = createCompletionFile(selectedFile, selectedNote.id);
      await uploadProjectNoteAttachment(projectId, selectedNote.id, completionFile);
      const updatedNote = await updateProjectNote(selectedNote.id, { status: 'done' });

      setBoard((current) => ({
        ...current,
        notes: current.notes.map((note) =>
          note.id === updatedNote.id
            ? {
                ...note,
                ...updatedNote,
                attachment_count: note.attachment_count + 1,
                comment_count: note.comment_count,
              }
            : note,
        ),
      }));
      clearSelectedImage();
      setMessage(`تم رفع صورة التنفيذ وإغلاق الملاحظة: ${selectedNote.title}`);
      onCompleted?.();
    } catch (completionError) {
      setError(
        completionError instanceof Error
          ? completionError.message
          : 'تعذر رفع صورة التنفيذ وإغلاق الملاحظة',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-construction-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-construction-primary" />
          تصوير بعد التنفيذ
        </CardTitle>
        <CardDescription>
          اختر الملاحظة، التقط صورة بالكاميرا الخلفية، ثم اعتمدها لرفعها وإغلاق الملاحظة تلقائيًا.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex min-h-28 items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            تحميل الملاحظات...
          </div>
        ) : error && board.notes.length === 0 ? (
          <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => void loadNotes()}>
              <RefreshCw className="ml-2 h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">الملاحظة</label>
              <select
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selectedNoteId}
                disabled={uploading || availableNotes.length === 0}
                onChange={(event) => {
                  setSelectedNoteId(event.target.value);
                  setMessage(null);
                  setError(null);
                  clearSelectedImage();
                }}
              >
                {availableNotes.length === 0 ? (
                  <option value="">لا توجد ملاحظات متاحة</option>
                ) : (
                  availableNotes.map((note) => {
                    const section = board.sections.find((item) => item.id === note.section_id);
                    return (
                      <option key={note.id} value={note.id}>
                        {note.status === 'done' ? '✓ ' : ''}
                        {section?.title ? `${section.title} — ` : ''}
                        {note.title}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                className="h-12"
                disabled={uploading || !selectedNote}
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="ml-2 h-5 w-5" />
                فتح الكاميرا الخلفية
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12"
                disabled={uploading || !selectedNote}
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImagePlus className="ml-2 h-5 w-5" />
                اختيار صورة من الهاتف
              </Button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={uploading}
              onChange={(event) => handleImageSelected(event.currentTarget.files?.[0])}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(event) => handleImageSelected(event.currentTarget.files?.[0])}
            />

            {previewUrl && selectedFile && (
              <div className="space-y-3 rounded-lg border bg-slate-50 p-3">
                <div className="relative overflow-hidden rounded-md bg-black">
                  <img
                    src={previewUrl}
                    alt="معاينة صورة التنفيذ"
                    className="max-h-[55vh] w-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-2"
                    disabled={uploading}
                    onClick={clearSelectedImage}
                    aria-label="إلغاء الصورة"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="break-all text-xs text-muted-foreground">{selectedFile.name}</p>
                <Button
                  type="button"
                  className="h-12 w-full"
                  disabled={uploading || !selectedNote}
                  onClick={() => void handleComplete()}
                >
                  {uploading ? (
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="ml-2 h-5 w-5" />
                  )}
                  {uploading ? 'جارٍ الرفع والإغلاق...' : 'اعتماد الصورة وإنهاء الملاحظة'}
                </Button>
              </div>
            )}

            {message && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">
                {message}
              </div>
            )}
            {error && board.notes.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                {error}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectNoteCompletionCamera;
