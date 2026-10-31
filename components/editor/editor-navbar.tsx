"use client";

import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PROJECT_SIDEBAR_ID } from "@/components/editor/project-sidebar";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  center?: ReactNode;
  right?: ReactNode;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  center,
  right,
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-chrome-border bg-chrome px-3 text-on-chrome">
      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls={PROJECT_SIDEBAR_ID}
          className="text-on-chrome-muted hover:bg-chrome-hover hover:text-on-chrome"
        >
          <ToggleIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center">{center}</div>

      <div className="flex flex-1 items-center justify-end gap-2">{right}</div>
    </header>
  );
}
