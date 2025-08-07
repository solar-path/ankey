import type { DrawerComponentMetadata, DrawerContent, DrawerState } from '@/shared';
import React from 'react';
import { create } from 'zustand';

// Using types from centralized types folder

// Create the Zustand store
export const useDrawerStore = create<DrawerState>((set) => ({
    isOpen: false,
    title: '',
    description: '',
    content: null,

    // Action to open the drawer
    openDrawer: (titleOrContent: string | React.ReactElement, description?: string, content?: React.ReactNode) => {
        // Handle different call patterns
        let title = '';
        let finalDescription = '';
        let finalContent: DrawerContent = null;

        if (typeof titleOrContent === 'string') {
            // Traditional call pattern: open(title, description, content)
            title = titleOrContent;
            finalDescription = description || '';
            finalContent = content || null;
        } else {
            // New pattern: open(component)
            finalContent = titleOrContent;

            // Try to extract metadata from the component
            const componentType = titleOrContent.type as DrawerComponentMetadata;
            title = componentType.defaultTitle || '';
            finalDescription = componentType.defaultDescription || '';
        }

        // Update the store
        set({
            isOpen: true,
            title,
            description: finalDescription,
            content: finalContent,
        });
    },

    // Action to close the drawer
    closeDrawer: () => {
        console.log('Closing drawer');
        set((state) => ({
            ...state,
            isOpen: false,
        }));
    },
}));

// Export a simplified hook for easier consumption in components
export const useDrawer = () => {
    const { isOpen, title, description, content, openDrawer, closeDrawer } = useDrawerStore();

    return {
        state: { isOpen, title, description, content },
        openDrawer,
        closeDrawer,
    };
};