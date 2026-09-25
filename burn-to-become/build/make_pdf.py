"""Open the .docx in LibreOffice, refresh the table of contents, and export a print PDF.
Usage: python3 make_pdf.py <in.docx> <out.pdf> [--preview]  (--preview = small file for on-screen reading)"""
import subprocess, sys, time, os, uno
from com.sun.star.beans import PropertyValue

def prop(n, v):
    p = PropertyValue(); p.Name = n; p.Value = v; return p

src, dst = map(os.path.abspath, sys.argv[1:3])
preview = '--preview' in sys.argv
proc = subprocess.Popen(['soffice', '--headless', '--norestore', '--accept=socket,host=localhost,port=2002;urp;'])
ctx = None
for _ in range(60):
    try:
        local = uno.getComponentContext()
        resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
        ctx = resolver.resolve('uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext'); break
    except Exception:
        time.sleep(1)
desktop = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(src), '_blank', 0, (prop('Hidden', True),))
for _ in range(2):
    idx = doc.getDocumentIndexes()
    for k in range(idx.getCount()):
        idx.getByIndex(k).update()
    doc.refresh()
doc.storeToURL(uno.systemPathToFileUrl(dst), (prop('FilterName', 'writer_pdf_Export'),
    prop('FilterData', uno.Any('[]com.sun.star.beans.PropertyValue', tuple([prop('Quality', 60 if preview else 92), prop('ReduceImageResolution', preview), prop('MaxImageResolution', 110)])))))
doc.close(True)
try: desktop.terminate()
except Exception: pass
proc.wait(timeout=30)
print('wrote', dst)
