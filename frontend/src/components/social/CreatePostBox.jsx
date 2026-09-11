import React, { useState } from 'react';
import { Send, Code, Image as ImageIcon, Tag, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import postService from '../../services/postService';
import Button from '../common/Button';

export const CreatePostBox = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [content, setContent] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      const newPost = await postService.createPost({
        content: content.trim(),
        code_snippet: showCode ? codeSnippet.trim() : '',
        code_language: showCode ? codeLanguage : '',
        image_url: showImage ? imageUrl.trim() : '',
        tags: tags.trim(),
      });

      success('Post published to feed!');
      setContent('');
      setCodeSnippet('');
      setShowCode(false);
      setImageUrl('');
      setShowImage(false);
      setTags('');

      if (onPostCreated) onPostCreated(newPost);
    } catch (err) {
      error(err.response?.data?.content?.[0] || 'Failed to publish post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-start gap-3">
        {user?.profile?.avatar_url ? (
          <img
            src={user.profile.avatar_url}
            alt={user.username}
            className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-700 mt-1 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-indigo-700 text-white flex items-center justify-center font-bold text-sm mt-1 shrink-0">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}

        <div className="flex-1">
          <textarea
            rows={3}
            placeholder="Share an architectural tip, code discovery, or project update..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none"
          />

          {/* Expandable Code Snippet Input */}
          {showCode && (
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-indigo-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" /> Code Snippet
                </span>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash</option>
                </select>
              </div>
              <textarea
                rows={4}
                placeholder="Paste or write snippet here..."
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Expandable Image URL Input */}
          {showImage && (
            <div className="mt-3">
              <input
                type="url"
                placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Tags Input */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Add tags separated by commas (e.g. react, django, fullstack)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Toolbar Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border transition-colors ${
              showCode ? 'bg-indigo-950 text-indigo-300 border-indigo-700' : 'bg-slate-800/40 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImage(!showImage)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border transition-colors ${
              showImage ? 'bg-indigo-950 text-indigo-300 border-indigo-700' : 'bg-slate-800/40 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Media</span>
          </button>
        </div>

        <Button
          onClick={handleSubmit}
          variant="primary"
          size="sm"
          icon={Send}
          loading={loading}
          disabled={!content.trim()}
        >
          Publish Post
        </Button>
      </div>
    </div>
  );
};

export default CreatePostBox;
