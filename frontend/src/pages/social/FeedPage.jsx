import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Compass, Users, TrendingUp, Search, RefreshCw } from 'lucide-react';
import CreatePostBox from '../../components/social/CreatePostBox';
import PostCard from '../../components/social/PostCard';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import postService from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const FeedPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('explore'); // 'home' or 'explore'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab === 'home') params.feed = 'home';
      if (selectedTag) params.tag = selectedTag;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await postService.getPosts(params);
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedTag, searchQuery]);

  const loadSuggestedUsers = useCallback(async () => {
    try {
      const users = await postService.getUsers({ suggest: true });
      setSuggestedUsers(users.slice(0, 4));
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    loadSuggestedUsers();
  }, [loadSuggestedUsers]);

  const handleFollowFromSuggestion = async (username) => {
    try {
      await postService.toggleFollow(username);
      success(`Updated follow for @${username}`);
      loadSuggestedUsers();
      if (activeTab === 'home') loadPosts();
    } catch (err) {
      error('Failed to follow user.');
    }
  };

  const trendingTags = ['react', 'django', 'fullstack', 'tailwind', 'python', 'architecture'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
      {/* Main Feed Column (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Feed Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('explore');
                setSelectedTag('');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'explore'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore Community
            </button>

            <button
              onClick={() => {
                setActiveTab('home');
                setSelectedTag('');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              Following Feed
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search posts or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-52"
            />
          </div>
        </div>

        {/* Compose Post Box */}
        <CreatePostBox
          onPostCreated={(newPost) => {
            setPosts((prev) => [newPost, ...prev]);
          }}
        />

        {/* Posts Stream */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-44 rounded-3xl bg-slate-900/50 animate-pulse border border-slate-800" />
            <div className="h-44 rounded-3xl bg-slate-900/50 animate-pulse border border-slate-800" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title={activeTab === 'home' ? 'No posts from people you follow' : 'No posts found'}
            description={
              activeTab === 'home'
                ? 'Follow more developers or switch to Explore Community to see latest posts.'
                : 'Be the first developer to publish a post to the feed!'
            }
          />
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={(upd) => {
                  setPosts((prev) => prev.map((p) => (p.id === upd.id ? upd : p)));
                }}
                onPostDeleted={(delId) => {
                  setPosts((prev) => prev.filter((p) => p.id !== delId));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar: Trending & Who to follow */}
      <div className="space-y-6">
        {/* Trending Tags */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Trending Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                    : 'bg-slate-800/40 text-slate-300 hover:text-white border-slate-700/60 hover:border-slate-600'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Who to Follow Suggestions */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Developers to Follow
          </h3>

          {suggestedUsers.length === 0 ? (
            <p className="text-xs text-slate-500">You're already following all team members!</p>
          ) : (
            <div className="space-y-3">
              {suggestedUsers.map((su) => (
                <div key={su.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {su.profile?.avatar_url ? (
                      <img
                        src={su.profile.avatar_url}
                        alt={su.username}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {su.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 truncate">
                      <p className="text-xs font-bold text-slate-100 truncate">{su.first_name || su.username}</p>
                      <p className="text-[10px] text-slate-500 truncate">@{su.username}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFollowFromSuggestion(su.username)}
                    className="text-xs px-2.5 py-1 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition-all font-semibold shrink-0"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
