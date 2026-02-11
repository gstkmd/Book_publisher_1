import { CollaborativeEditor } from '@/components/CollaborativeEditor';

export default function EditorPage({ params }: { params: { id: string } }) {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Generic Publisher - Collaboration Studio</h1>
            <CollaborativeEditor documentId={params.id} />
        </div>
    );
}
