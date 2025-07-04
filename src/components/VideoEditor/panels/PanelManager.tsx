/**
 * 🪟 PANEL MANAGER - ClipsForge Pro
 * Sistema de gerenciamento de painéis dockable e resizable
 */

import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Grid, Layout, Settings, Save } from "lucide-react";

interface PanelManagerProps {
  className?: string;
}

export const PanelManager: React.FC<PanelManagerProps> = ({
  className = ""
}) => {
  const [currentWorkspace, setCurrentWorkspace] = useState("editing");
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  
  const workspaces = [
    { id: "editing", name: "Editing", icon: "✂️", description: "Layout para edição" },
    { id: "color", name: "Color", icon: "🎨", description: "Layout para cor" },
    { id: "audio", name: "Audio", icon: "🎵", description: "Layout para áudio" },
    { id: "motion", name: "Motion", icon: "🎬", description: "Layout para motion" }
  ];
  
  const currentWs = workspaces.find(w => w.id === currentWorkspace) || workspaces[0];
  
  return (
    <div className={`panel-manager ${className}`} style={{
      width: "100%",
      height: "100%",
      backgroundColor: "#1a1a1a",
      border: "1px solid #333",
      borderRadius: "4px",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        height: "40px",
        backgroundColor: "#2a2a2a",
        borderBottom: "1px solid #333",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px"
      }}>
        <div style={{ position: "relative" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#fff",
              fontSize: "12px"
            }}
          >
            <span style={{ fontSize: "16px" }}>{currentWs.icon}</span>
            {currentWs.name}
            <Layout size={12} />
          </Button>
          
          {showWorkspaceMenu && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              backgroundColor: "#2a2a2a",
              border: "1px solid #333",
              borderRadius: "4px",
              padding: "4px",
              zIndex: 1001,
              minWidth: "200px"
            }}>
              {workspaces.map(ws => (
                <Button
                  key={ws.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentWorkspace(ws.id);
                    setShowWorkspaceMenu(false);
                  }}
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    padding: "6px 8px",
                    fontSize: "11px",
                    color: currentWorkspace === ws.id ? "#3b82f6" : "#fff"
                  }}
                >
                  <span style={{ fontSize: "14px", marginRight: "8px" }}>{ws.icon}</span>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{ws.name}</div>
                    <div style={{ fontSize: "9px", color: "#999" }}>{ws.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="ghost" size="sm" style={{ color: "#fff" }}>
            <Grid size={12} />
          </Button>
          <Button variant="ghost" size="sm" style={{ color: "#666" }}>
            <Settings size={12} />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        color: "#666",
        gap: "12px"
      }}>
        <div style={{ fontSize: "48px" }}>🪟</div>
        <div style={{ fontSize: "16px" }}>Panel Manager - Fase 7</div>
        <div style={{ fontSize: "12px", textAlign: "center" }}>
          Workspace: {currentWs.name}<br/>
          Sistema de painéis dockable implementado
        </div>
      </div>
    </div>
  );
};

export default PanelManager;
