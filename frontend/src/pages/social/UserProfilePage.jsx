import {
  User, MapPin, Briefcase, Globe, GitBranch, Calendar,
  UserPlus, UserCheck, MessageSquare, Heart
} from 'lucide-react';
import PostCard from '../../components/social/PostCard';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import postService from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const UserProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, userPosts] = await Promise.all([
        postService.getUser(username),
        postService.getPosts({ author: username }),
      ]);
      setProfileUser(userData);
      setIsFollowing(userData.is_following);
      setFollowersCount(userData.profile?.followers_count || 0);
      setPosts(userPosts);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollowToggle = async () => {
    try {
      setFollowLoading(true);
      const res = await postService.toggleFollow(username);
      setIsFollowing(res.is_following);
      setFollowersCount(res.followers_count);
      success(res.message);
    } catch (err) {
      error('Failed to update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800" />
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <EmptyState
        title="Developer not found"
        description="The developer profile you are looking for does not exist."
      />
    );
  }

  const isSelf = currentUser?.id === profileUser.id;
  const p = profileUser.profile || {};

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl">
        {/* Banner graphic */}
        <div className="h-32 bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950/60 border-b border-slate-800/80" />

        {/* Profile Card Info */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
            {p.avatar_url ? (
              <img
                src={p.avatar_url}
                alt={profileUser.username}
                className="w-24 h-24 rounded-3xl object-cover ring-4 ring-slate-900 shadow-2xl bg-slate-900"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-indigo-700 text-white flex items-center justify-center font-bold text-3xl ring-4 ring-slate-900 shadow-2xl">
                {profileUser.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            <div className="flex items-center gap-3">
              {isSelf ? (
                <Link to="/settings">
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <Button
                  variant={isFollowing ? 'secondary' : 'primary'}
                  size="sm"
                  loading={followLoading}
                  onClick={handleFollowToggle}
                  icon={isFollowing ? UserCheck : UserPlus}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </div>

          {/* Bio & Details */}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {profileUser.first_name ? `${profileUser.first_name} ${profileUser.last_name || ''}` : profileUser.username}
            </h1>
            <p className="text-xs text-slate-500 font-mono">@{profileUser.username}</p>

            <p className="text-xs text-slate-300 font-medium mt-1">
              {p.job_title || 'Full Stack Engineer'} • {p.department || 'Engineering'}
            </p>

            {p.bio && (
              <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-2xl">
                {p.bio}
              </p>
            )}

            {/* Links and Stats */}
            <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{posts.length}</span> Posts
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{followersCount}</span> Followers
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{p.following_count || 0}</span> Following
              </div>

              {p.website && (
                <a
                  href={p.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </a>
              )}

              {p.github_url && (
                <a
                  href={p.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">
          Posts by {profileUser.first_name || profileUser.username}
        </h2>

        {posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            description="This developer hasn't published any posts or code snippets yet."
          />
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={(upd) => setPosts((prev) => prev.map((p) => (p.id === upd.id ? upd : p)))}
                onPostDeleted={(delId) => setPosts((prev) => prev.filter((p) => p.id !== delId))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
