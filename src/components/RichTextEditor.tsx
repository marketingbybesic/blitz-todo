import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your notes, project specs, or brain dumps here...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-none focus:outline-none min-h-[200px] text-sm text-foreground/80 leading-relaxed',
      },
    },
  });

  return (
    <div className="bg-card/[0.02] border border-white/5 rounded-xl p-4 transition-all focus-within:border-accent/30 focus-within:bg-card/[0.04] w-full flex-1 overflow-y-auto">
      <EditorContent editor={editor} className="w-full h-full" />
    </div>
  );
}
