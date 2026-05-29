import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
    Package,
    Search,
    LayoutDashboard,
    Truck,
    Settings,
    HelpCircle,
    Bell,
    AlertTriangle,
    User,
    LogOut,
    Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    role: "admin" | "staff" | "user";
}

const CommandPalette = ({ open, setOpen, role }: CommandPaletteProps) => {
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(!open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, setOpen]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-[#050508]/80 backdrop-blur-sm"
                    />

                    {/* Command Menu */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-2xl"
                    >
                        <Command className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl">
                            <div className="flex items-center border-b border-white/5 px-4 h-14">
                                <Search className="mr-3 h-5 w-5 text-white/40" />
                                <Command.Input
                                    placeholder="Type a command or search for a parcel..."
                                    className="flex h-full w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                                />
                                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-white/40 opacity-100 sm:flex">
                                    ESC
                                </kbd>
                            </div>

                            <Command.List className="max-h-[350px] overflow-y-auto p-2 scrollbar-hide">
                                <Command.Empty className="py-14 text-center text-sm text-white/30">
                                    No results found.
                                </Command.Empty>

                                <Command.Group heading={<span className="px-2 text-[10px] font-bold uppercase tracking-widest text-white/20">Navigation</span>} className="mb-2">
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate(`/${role}/dashboard`))}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all aria-selected:bg-white/5 aria-selected:text-white"
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span>Go to Dashboard</span>
                                    </Command.Item>
                                    {role === "user" && (
                                        <Command.Item
                                            onSelect={() => runCommand(() => navigate(`/user/book`))}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all aria-selected:bg-white/5 aria-selected:text-white"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Book New Parcel</span>
                                        </Command.Item>
                                    )}
                                    {role === "admin" && (
                                        <Command.Item
                                            onSelect={() => runCommand(() => navigate(`/admin/anomalies`))}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all aria-selected:bg-white/5 aria-selected:text-white"
                                        >
                                            <AlertTriangle className="h-4 w-4 text-orange-400" />
                                            <span>View AI Anomalies</span>
                                        </Command.Item>
                                    )}
                                </Command.Group>

                                <Command.Group heading={<span className="px-2 text-[10px] font-bold uppercase tracking-widest text-white/20">Parcels</span>} className="mb-2">
                                    <Command.Item className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all aria-selected:bg-white/5 aria-selected:text-white">
                                        <Package className="h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span>Tracking ID: AP-20260012</span>
                                            <span className="text-[10px] text-white/30">From: Pune GPO · To: Delhi Hub</span>
                                        </div>
                                    </Command.Item>
                                    <Command.Item className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all aria-selected:bg-white/5 aria-selected:text-white">
                                        <Truck className="h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span>Tracking ID: AP-20260087</span>
                                            <span className="text-[10px] text-orange-400">Delayed: In Nagpur Sort Center</span>
                                        </div>
                                    </Command.Item>
                                </Command.Group>

                                <Command.Group heading={<span className="px-2 text-[10px] font-bold uppercase tracking-widest text-white/20">Account</span>}>
                                    <Command.Item className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all aria-selected:bg-white/5 aria-selected:text-white">
                                        <User className="h-4 w-4" />
                                        <span>Profile Settings</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate("/login"))}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all aria-selected:bg-red-500/10 aria-selected:text-red-400"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Log Out</span>
                                    </Command.Item>
                                </Command.Group>
                            </Command.List>

                            <div className="flex items-center gap-4 border-t border-white/5 px-4 h-10 bg-white/[0.02]">
                                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                                    <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono">↵</kbd>
                                    <span>Select</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                                    <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono">↑↓</kbd>
                                    <span>Navigate</span>
                                </div>
                            </div>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
