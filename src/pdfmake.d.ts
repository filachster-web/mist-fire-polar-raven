declare module "pdfmake/build/pdfmake" {
  type PdfMakeApi = {
    addVirtualFileSystem: (vfs: Record<string, string>) => void;
    createPdf: (definition: object) => { getBlob: () => Promise<Blob> };
  };
  const pdfMake: PdfMakeApi;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfs: Record<string, string>;
  export default vfs;
}
