'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent, type DragEvent } from 'react';
import { ArrowUpRight, BookOpen, FileText, Globe2, Link2, Loader2, MessageSquare, Plus, Search, Trash2, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { deleteDocument, getHistory, ingestUrl, queryKnowledgeBase, uploadDocument } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import type { Document } from '../../types/research';

type Source = Document & { s3_url?: string | null; file_type?: string; created_at?: string };
type View = 'sources' | 'add' | 'ask';
type SourceType = 'PDF' | 'Text' | 'Word' | 'Website' | 'YouTube' | 'File';
type Notice = { kind: 'error' | 'success'; message: string };

const views = [
  { id: 'sources', label: 'Sources', icon: BookOpen },
  { id: 'add', label: 'Add source', icon: Plus },
  { id: 'ask', label: 'Ask the library', icon: MessageSquare },
] as const;

const sourceTypes: SourceType[] = ['PDF', 'Text', 'Word', 'Website', 'YouTube', 'File'];
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function sourceType(source: Source): SourceType {
  const type = (source.mimetype || source.file_type || '').toLowerCase();
  if (type === 'website' || type === 'url') return 'Website';
  if (type === 'youtube') return 'YouTube';
  if (/pdf/.test(type) || /\.pdf$/i.test(source.filename)) return 'PDF';
  if (/text\/plain|^txt$/.test(type) || /\.txt$/i.test(source.filename)) return 'Text';
  if (/word|docx?/.test(type) || /\.docx?$/i.test(source.filename)) return 'Word';
  return 'File';
}

function sourceHref(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export default function DocumentsPage() {
  const { token, user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [view, setView] = useState<View>('sources');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [url, setUrl] = useState('');
  const [urlType, setUrlType] = useState<'website' | 'youtube'>('website');
  const [pendingImport, setPendingImport] = useState<'file' | 'link' | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ question: string; text: string; sources: string[] } | null>(null);
  const [asking, setAsking] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refreshSources = useCallback(async (authToken: string) => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      setSources(await getHistory(authToken));
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void refreshSources(token);
  }, [token, refreshSources]);

  function showError(error: unknown, fallback: string) {
    setNotice({ kind: 'error', message: error instanceof Error ? error.message : fallback });
  }

  function addSource(source: Source) {
    setSources(current => [source, ...current]);
    setSearch('');
    setFilter('all');
    setView('sources');
    setNotice({ kind: 'success', message: `Added “${source.filename}” to the library.` });
  }

  async function uploadFile(file: File) {
    if (!token || !user || isLoading || pendingImport) return;
    setNotice(null);
    if (!['application/pdf', 'text/plain'].includes(file.type) && !/\.docx?$/i.test(file.name)) {
      showError(null, 'Choose a PDF, TXT, DOC, or DOCX file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError(null, 'Choose a file under 10 MB.');
      return;
    }

    setPendingImport('file');
    try {
      addSource(await uploadDocument(file, user.id, token));
    } catch (error) {
      showError(error, 'The file could not be added.');
    } finally {
      setPendingImport(null);
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void uploadFile(file);
  }

  async function importLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !user || isLoading || pendingImport || !url.trim()) return;
    setNotice(null);
    setPendingImport('link');
    try {
      const { document } = await ingestUrl(url.trim(), urlType, user.id, token);
      setUrl('');
      addSource(document);
    } catch (error) {
      showError(error, 'The link could not be added.');
    } finally {
      setPendingImport(null);
    }
  }

  async function removeSource(id: string) {
    if (!token || removing) return;
    setNotice(null);
    setRemoving(true);
    try {
      await deleteDocument(id, token);
      setSources(current => current.filter(source => source.document_id !== id));
      setPendingRemoval(null);
      setNotice({ kind: 'success', message: 'Source removed.' });
    } catch (error) {
      showError(error, 'The source could not be removed.');
    } finally {
      setRemoving(false);
    }
  }

  async function askLibrary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = question.trim();
    if (!token || !user || !query || asking) return;
    setNotice(null);
    setAsking(true);
    try {
      const result = await queryKnowledgeBase(query, user.id, token);
      setAnswer({ question: query, text: result.answer, sources: result.sources || [] });
    } catch (error) {
      showError(error, 'The library could not answer this question.');
    } finally {
      setAsking(false);
    }
  }

  const filteredSources = sources.filter(source =>
    source.filename.toLowerCase().includes(search.trim().toLowerCase()) &&
    (filter === 'all' || sourceType(source) === filter)
  );

  return (
    <main className="rf-library">
      <header className="rf-library-heading">
        <div>
          <h1>Source library</h1>
          <p>Keep your research material together and ask questions about it.</p>
        </div>
        <button type="button" className="rf-button rf-button-primary" onClick={() => setView('add')}>
          <Plus size={18} aria-hidden="true" /> Add source
        </button>
      </header>

      <nav className="rf-library-nav" aria-label="Library views">
        {views.map(({ id, label, icon: Icon }) => (
          <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>
            <Icon size={17} aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>

      {notice && (
        <div className={`rf-library-notice ${notice.kind === 'error' ? 'text-rose-800' : 'text-emerald-800'}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
          <span>{notice.message}</span>
          <button type="button" className="rf-report-control" onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      )}

      {view === 'sources' && (
        <section className="rf-library-panel" aria-labelledby="sources-heading">
          <div className="rf-library-tools">
            <div>
              <h2 id="sources-heading">Saved sources</h2>
              {!isLoading && !loadFailed && <p>{filteredSources.length === sources.length ? `${sources.length} ${sources.length === 1 ? 'source' : 'sources'}` : `${filteredSources.length} of ${sources.length} sources`}</p>}
            </div>
            <div className="rf-library-filters">
              <label className="rf-library-search">
                <Search size={17} aria-hidden="true" />
                <input type="search" aria-label="Search sources" placeholder="Search by title" value={search} onChange={event => setSearch(event.target.value)} />
              </label>
              <select aria-label="Source type" value={filter} onChange={event => setFilter(event.target.value)}>
                <option value="all">All types</option>
                {sourceTypes.map(type => <option key={type}>{type}</option>)}
              </select>
            </div>
          </div>

          {isLoading ? <p className="rf-library-empty" role="status">Loading sources…</p> : loadFailed ? (
            <div className="rf-library-empty">
              <p>Could not load your sources.</p>
              <button type="button" className="rf-report-control" onClick={() => token && refreshSources(token)}>Try again</button>
            </div>
          ) : filteredSources.length ? (
            <ul className="rf-source-list">
              {filteredSources.map(source => {
                const type = sourceType(source);
                const Icon = type === 'Website' || type === 'YouTube' ? Globe2 : FileText;
                const href = sourceHref(source.s3_url);
                const date = new Date(source.uploaded_at || source.created_at || '');
                return (
                  <li key={source.document_id}>
                    <span className="rf-source-icon"><Icon size={19} aria-hidden="true" /></span>
                    <div className="rf-source-details">
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer">{source.filename} <ArrowUpRight size={15} aria-hidden="true" /></a>
                      ) : <strong>{source.filename}</strong>}
                      <p>{type}{Number.isFinite(date.getTime()) && <> · <time dateTime={date.toISOString()}>{dateFormatter.format(date)}</time></>}</p>
                    </div>
                    {pendingRemoval === source.document_id ? (
                      <div className="rf-source-actions">
                        <span className="text-sm text-ui-muted">Remove this source?</span>
                        <button type="button" className="rf-report-control" disabled={removing} onClick={() => setPendingRemoval(null)}>Cancel</button>
                        <button type="button" className="rf-report-control text-rose-800" disabled={removing} onClick={() => removeSource(source.document_id)}>{removing ? 'Removing…' : 'Remove'}</button>
                      </div>
                    ) : (
                      <button type="button" className="rf-report-control" aria-label={`Remove ${source.filename}`} disabled={removing} onClick={() => setPendingRemoval(source.document_id)}><Trash2 size={16} aria-hidden="true" /></button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rf-library-empty">
              <BookOpen size={27} aria-hidden="true" />
              <h3>{sources.length ? 'No matching sources' : 'Your library is empty'}</h3>
              <p>{sources.length ? 'Try a different title or source type.' : 'Add a document or a link to start your collection.'}</p>
              {sources.length ? (
                <button type="button" className="rf-report-control" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button>
              ) : (
                <button type="button" className="rf-button rf-button-primary" onClick={() => setView('add')}>Add your first source</button>
              )}
            </div>
          )}
        </section>
      )}

      {view === 'add' && (
        <section className="rf-library-add" aria-label="Add a source">
          <div className="rf-library-panel rf-library-form">
            <span className="rf-source-icon"><Upload size={19} aria-hidden="true" /></span>
            <h2>Upload a document</h2>
            <p>PDF, TXT, DOC, or DOCX. Up to 10 MB per file.</p>
            <div className="rf-library-drop" data-dragging={dragging} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
              <input type="file" ref={fileInput} className="sr-only" tabIndex={-1} aria-label="Upload a document" accept=".pdf,.txt,.doc,.docx" onChange={event => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void uploadFile(file);
              }} />
              <p>Drag a file here or choose one to upload.</p>
              <button type="button" className="rf-button rf-button-primary" disabled={isLoading || pendingImport !== null} onClick={() => fileInput.current?.click()}>
                {pendingImport === 'file' && <Loader2 className="motion-safe:animate-spin" size={16} aria-hidden="true" />}
                {pendingImport === 'file' ? 'Adding document…' : 'Choose file'}
              </button>
            </div>
          </div>
          <form className="rf-library-panel rf-library-form" onSubmit={importLink}>
            <span className="rf-source-icon"><Link2 size={19} aria-hidden="true" /></span>
            <h2>Add a link</h2>
            <p>Save a public webpage or a YouTube transcript.</p>
            <label>Link type<select value={urlType} onChange={event => setUrlType(event.target.value === 'youtube' ? 'youtube' : 'website')}>
              <option value="website">Website</option>
              <option value="youtube">YouTube</option>
            </select></label>
            <label>{urlType === 'youtube' ? 'Video URL' : 'Website URL'}
              <input type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder={urlType === 'youtube' ? 'https://www.youtube.com/watch?v=…' : 'https://example.com/article'} required />
            </label>
            <button type="submit" className="rf-button rf-button-primary self-start" disabled={isLoading || pendingImport !== null || !url.trim()}>
              {pendingImport === 'link' ? 'Adding link…' : 'Add link'}
            </button>
          </form>
        </section>
      )}

      {view === 'ask' && (
        <section className="rf-library-panel rf-library-form rf-library-ask" aria-labelledby="ask-heading">
          <span className="rf-source-icon"><MessageSquare size={19} aria-hidden="true" /></span>
          <h2 id="ask-heading">Ask the library</h2>
          <p>Ask a question across your saved files, webpages, and transcripts.</p>
          <form className="rf-library-form" onSubmit={askLibrary}>
            <label>Your question
              <textarea rows={3} value={question} onChange={event => setQuestion(event.target.value)} placeholder="What do these sources agree on?" required />
            </label>
            <button type="submit" className="rf-button rf-button-primary self-start" disabled={asking || !question.trim()}>{asking ? 'Looking through your sources…' : 'Ask question'}</button>
          </form>
          {answer && (
            <article className="rf-library-answer" aria-live="polite">
              <h3>{answer.question}</h3>
              <div className="prose prose-sm max-w-none"><ReactMarkdown>{answer.text}</ReactMarkdown></div>
              {answer.sources.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold">Sources used</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ui-muted">{Array.from(new Set(answer.sources)).map(source => <li key={source}>{source}</li>)}</ul>
                </div>
              )}
            </article>
          )}
        </section>
      )}
    </main>
  );
}
