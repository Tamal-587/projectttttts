import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, MessageSquare, MoreHorizontal, Trash2, Edit3, Send,
  Code, Copy, Check, UserPlus, UserCheck, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import postService from '../../services/postService';
import ConfirmationModal from '../common/ConfirmationModal';
import Button from '../common/Button';

export const PostCard = ({
  post,
  onPostUpdated,
  onPostDeleted,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isFollowing, setIsFollowing] = useState(post.author?.is_following || false);
  const [followLoading, setFollowLoading] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editLoading, setEditLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isAuthor = user?.id === post.author?.id;

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic toggle
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await postService.toggleLike(post.id);
      setIsLiked(res.is_liked);
      setLikesCount(res.likes_count);
    } catch (err) {
      // Revert
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      error('Failed to update like.');
    }
  };

  const handleFollowToggle = async () => {
    if (!post.author?.username) return;
    try {
      setFollowLoading(true);
      const res = await postService.toggleFollow(post.author.username);
      setIsFollowing(res.is_following);
      success(res.message);
    } catch (err) {
      error('Failed to update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setCommentLoading(true);
      const newComment = await postService.addComment(post.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      success('Comment posted!');
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          comments_count: (post.comments_count || 0) + 1,
        });
      }
    } catch (err) {
      error('Failed to post comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await postService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      success('Comment deleted');
    } catch (err) {
      error('Failed to delete comment.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      setEditLoading(true);
      const updated = await postService.updatePost(post.id, { content: editContent.trim() });
      setIsEditing(false);
      success('Post updated!');
      if (onPostUpdated) onPostUpdated(updated);
    } catch (err) {
      error('Failed to update post.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      setDeleteLoading(true);
      await postService.deletePost(post.id);
      success('Post deleted.');
      setShowDeleteConfirm(false);
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      error('Failed to delete post.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyCode = () => {
    if (!post.code_snippet) return;
    navigator.clipboard.writeText(post.code_snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <article className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl transition-all hover:border-slate-700/80 space-y-4">
      {/* Header: Author info & Follow/Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author?.username}`}>
            {post.author?.profile?.avatar_url ? (
              <img
                src={post.author.profile.avatar_url}
                alt={post.author.username}
                className="w-10 h-10 rounded-2xl object-cover ring-1 ring-indigo-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-indigo-700 text-white flex items-center justify-center font-bold text-sm">
                {post.author?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${post.author?.username}`}
                className="font-bold text-sm text-slate-100 hover:text-indigo-400 transition-colors"
              >
                {post.author?.first_name
                  ? `${post.author.first_name} ${post.author.last_name || ''}`
                  : post.author?.username}
              </Link>
              <span className="text-xs text-slate-500">@{post.author?.username}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {post.author?.profile?.job_title || 'Software Developer'} • {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Follow toggle button if not own post */}
          {!isAuthor && (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`text-xs px-2.5 py-1 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                isFollowing
                  ? 'bg-slate-800 text-slate-300 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-700'
                  : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}

          {/* Author actions dropdown */}
          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-slate-850 border border-slate-700 rounded-xl shadow-xl z-20 py-1 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setIsEditing(true);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Post
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Post Content */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" loading={editLoading} onClick={handleSaveEdit}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Optional Code Snippet Block */}
      {post.code_snippet && (
        <div className="rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden font-mono text-xs">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-indigo-400">
              <Code className="w-3.5 h-3.5" />
              {post.code_language || 'snippet'}
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-slate-300 leading-relaxed">
            <code>{post.code_snippet}</code>
          </pre>
        </div>
      )}

      {/* Optional Image Preview */}
      {post.image_url && (
        <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-96">
          <img
            src={post.image_url}
            alt="Post attachment"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Tags */}
      {post.tags && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.tags.split(',').map((tag) => (
            <span
              key={tag.trim()}
              className="text-[11px] text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-md font-medium"
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Action Footer: Likes & Comments */}
      <div className="flex items-center gap-6 pt-3 border-t border-slate-800/80 text-xs">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 font-medium transition-colors ${
            isLiked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>{likesCount} Likes</span>
        </button>

        <button
          onClick={() => setCommentsOpen(!commentsOpen)}
          className="flex items-center gap-1.5 font-medium text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{comments.length} Comments</span>
        </button>
      </div>

      {/* Expandable Comments Section */}
      {commentsOpen && (
        <div className="pt-3 border-t border-slate-800/60 space-y-3">
          {/* Post a Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Add your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              icon={Send}
              loading={commentLoading}
              disabled={!commentText.trim()}
            >
              Post
            </Button>
          </form>

          {/* Comments List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 text-center">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {c.author.profile?.avatar_url ? (
                      <img
                        src={c.author.profile.avatar_url}
                        alt={c.author.username}
                        className="w-6 h-6 rounded-full object-cover mt-0.5"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-800 text-white flex items-center justify-center font-bold text-[10px] mt-0.5">
                        {c.author.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-slate-200">{c.author.first_name || c.author.username}</span>
                        <span className="text-[10px] text-slate-500">@{c.author.username}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                  </div>

                  {(c.author.id === user?.id || isAuthor) && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message="Are you sure you want to permanently remove this post? All likes and comments will be deleted."
        loading={deleteLoading}
      />
    </article>
  );
};

export default PostCard;
