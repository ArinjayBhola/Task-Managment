import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Calendar, CheckCircle, Plus, LayoutGrid, Zap } from "lucide-react";
import { useUIStore } from "../store/ui";
import { cn } from "../lib/utils";

export const CommandPalette = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  return (
    <Command.Dialog
      open={isCommandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      label="Global Command Menu"
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] rounded-xl border border-border bg-background shadow-2xl p-0 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <Command.Input
          placeholder="Type a command or search..."
          className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
        <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>

        <Command.Group heading="Suggestions" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          <CommandItem icon={Plus} label="New Task" shortcut="N" />
          <CommandItem icon={CheckCircle} label="Go to My Tasks" shortcut="G T" />
          <CommandItem icon={Calendar} label="Go to Inbox" shortcut="G I" />
        </Command.Group>

        <Command.Group heading="Views" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          <CommandItem icon={LayoutGrid} label="Board View" />
          <CommandItem icon={Zap} label="Quick Actions" />
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
};

const CommandItem = ({ icon: Icon, label, shortcut }: { icon: any, label: string, shortcut?: string }) => (
  <Command.Item className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
    <Icon className="mr-2 h-4 w-4" />
    <span>{label}</span>
    {shortcut && (
      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">{shortcut}</span>
      </kbd>
    )}
  </Command.Item>
);
