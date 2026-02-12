import io
from app.modules.generic.models import Content

class PublishingService:
    async def export_pdf(self, content: Content) -> bytes:
        try:
            from weasyprint import HTML
        except ImportError:
            # Fallback or error if not installed
            print("WeasyPrint not found. Please install validation dependencies.")
            return b"%PDF-1.4 ... (Mock specific content due to missing libraries)"

        # 1. Convert Rich Text JSON to HTML (Simplified for POC)
        # In prod, use a proper ProseMirror->HTML serializer
        body_html = f"<div>{str(content.body)}</div>"
        
        full_html = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: serif; line-height: 1.5; }}
                    h1 {{ color: #333; }}
                </style>
            </head>
            <body>
                <h1>{content.title}</h1>
                <p><i>By Author (ID: {content.author.ref.id})</i></p>
                <hr/>
                {body_html}
            </body>
        </html>
        """
        
        # 2. Generate PDF
        pdf_buffer = io.BytesIO()
        HTML(string=full_html).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        return pdf_buffer.read()

    async def export_epub(self, content: Content) -> bytes:
        try:
            from ebooklib import epub
        except ImportError:
            print("EbookLib not found.")
            return b"EPUB Mock Data"
        
        book = epub.EpubBook()
        book.set_identifier(str(content.id))
        book.set_title(content.title)
        book.set_language('en')
        book.add_author(f"User {content.author.ref.id}")
        
        # Create chapter
        c1 = epub.EpubHtml(title='Content', file_name='content.xhtml', lang='en')
        c1.content = f'<h1>{content.title}</h1><p>{str(content.body)}</p>'
        book.add_item(c1)
        
        # Define Table of Contents
        book.toc = (epub.Link('content.xhtml', 'Content', 'intro'), )
        
        # Add default NCX and Nav file
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())
        
        # Define CSS style
        style = 'body { font-family: Times, serif; }'
        nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
        book.add_item(nav_css)
        
        # Basic spine
        book.spine = ['nav', c1]
        
        # Write to buffer
        # EbookLib writes to a file path or file-like object.
        # It's a bit tricky with BytesIO sometimes, but let's try.
        buffer = io.BytesIO()
        epub.write_epub(buffer, book, {})
        buffer.seek(0)
        return buffer.read()

publishing_service = PublishingService()
