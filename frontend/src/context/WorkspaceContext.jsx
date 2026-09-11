import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import workspaceService from '../services/workspaceService';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const list = await workspaceService.getWorkspaces();
      setWorkspaces(list);

      if (list.length > 0) {
        const savedSlug = localStorage.getItem('taskflow_current_workspace_slug');
        const found = list.find((w) => w.slug === savedSlug) || list[0];
        setCurrentWorkspace(found);
        localStorage.setItem('taskflow_current_workspace_slug', found.slug);
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const selectWorkspace = (slug) => {
    const ws = workspaces.find((w) => w.slug === slug);
    if (ws) {
      setCurrentWorkspace(ws);
      localStorage.setItem('taskflow_current_workspace_slug', ws.slug);
    }
  };

  const createWorkspace = async (data) => {
    const newWs = await workspaceService.createWorkspace(data);
    setWorkspaces((prev) => [newWs, ...prev]);
    setCurrentWorkspace(newWs);
    localStorage.setItem('taskflow_current_workspace_slug', newWs.slug);
    return newWs;
  };

  const currentRole = currentWorkspace?.my_role || null;
  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';
  const isViewer = currentRole === 'VIEWER';

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentRole,
        isOwnerOrAdmin,
        isViewer,
        loading,
        selectWorkspace,
        createWorkspace,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
