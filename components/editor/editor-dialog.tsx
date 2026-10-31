"use client";

import type { ComponentProps, ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditorDialogProps
  extends Pick<ComponentProps<typeof Dialog>, "open" | "onOpenChange"> {
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

/**
 * Shared dialog pattern for editor screens: token-styled shell with a title,
 * optional description, body, and footer actions. Concrete dialogs compose this.
 */
export function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: EditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 rounded-3xl bg-elevated p-6 text-copy-primary shadow-lg ring-surface-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-copy-primary">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-copy-muted">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children}

        {footer && (
          <DialogFooter className="-mx-6 -mb-6 rounded-b-3xl border-surface-border bg-subtle px-6 py-4">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
