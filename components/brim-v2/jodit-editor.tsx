'use client'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { JoditEditorProps } from 'jodit-react'
import 'jodit/es2021/jodit.min.css'

// Jodit touches window/document on import, so it is loaded client-side only.
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-[10px] bg-[#efe8da]/60 ring-1 ring-[#161616]/15 flex items-center justify-center text-[12px] text-[#57534e]">
      Memuat editor…
    </div>
  ),
})

const UPLOAD_URL = '/api/brim/artikel/upload'

export function JoditArtikelEditor({ initial, onChange }: { initial: string; onChange: (html: string) => void }) {
  // The config object must stay stable, otherwise Jodit re-creates the editor on every render and loses the caret.
  const config = useMemo(
    () =>
      ({
        readonly: false,
        height: 420,
        minHeight: 320,
        placeholder: 'Tulis artikel di sini…',
        toolbarAdaptive: true,
        toolbarSticky: false,
        buttons: 'bold,italic,underline,strikethrough,|,paragraph,|,ul,ol,|,align,|,link,image,video,|,undo,redo,|,eraser',
        buttonsMD: 'bold,italic,paragraph,ul,ol,link,image,video,undo,redo',
        buttonsSM: 'bold,italic,paragraph,ul,ol,link,image,video,undo,redo',
        buttonsXS: 'bold,italic,paragraph,ul,link,image,video,undo',
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        defaultActionOnPaste: 'insert_clear_html',
        insertImageAsBase64URI: false,
        controls: {
          paragraph: {
            list: { p: 'Paragraf', h2: 'Judul', h3: 'Subjudul', h4: 'Sub-subjudul', blockquote: 'Kutipan' },
          },
        },
        uploader: {
          url: UPLOAD_URL,
          method: 'POST',
          format: 'json',
          withCredentials: true,
          filesVariableName: () => 'file',
          isSuccess: (resp: { ok?: boolean }) => resp.ok === true,
          getMessage: (resp: { error?: string }) => resp.error ?? '',
          process: (resp: { ok?: boolean; url?: string; error?: string }) => ({
            files: resp.url ? [resp.url] : [],
            path: '',
            baseurl: '',
            error: resp.ok ? 0 : 1,
            msg: resp.error ?? '',
          }),
          defaultHandlerSuccess(this: { j?: { s: { insertImage: (url: string) => void } } }, data: { files?: string[] }) {
            for (const url of data.files ?? []) this.j?.s.insertImage(url)
          },
        },
      }) as unknown as JoditEditorProps['config'],
    [],
  )

  return (
    <div className="[&_.jodit-container]:!rounded-[10px] [&_.jodit-container]:!border-[#161616]/20 [&_.jodit-wysiwyg]:!text-[16px] [&_.jodit-wysiwyg]:!leading-relaxed">
      <JoditEditor value={initial} config={config} onChange={onChange} onBlur={onChange} />
    </div>
  )
}
