import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { UploadType } from './common';
// https://github.com/facebook/react/issues/3468#issuecomment-1031366038
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}
function transformFileListWindows(fileList: FileList) {
  const dt = new DataTransfer();
  if (fileList.length > 0) {
    const file = fileList[0];
    if (file.name.endsWith('.zip')) {
      dt.items.add(file);
    }
  }
  return dt.files;
}
function isHiddenFile(file: File) {
  const directories = file.webkitRelativePath.split('/');
  return directories.find((x) => x.startsWith('.')) !== undefined;
}
function transformFileListWebGL(fileList: FileList) {
  const dt = new DataTransfer();
  for (const file of fileList) {
    if (isHiddenFile(file)) {
      continue;
    }
    dt.items.add(file);
  }
  return dt.files;
}
function transformFileList(fileList: FileList, uploadType: UploadType) {
  if (uploadType === 'windows') {
    return transformFileListWindows(fileList);
  }
  return transformFileListWebGL(fileList);
}
export const FilesPicker = ({
  title,
  uploadType,
  onChange,
}: {
  title: string;
  uploadType: UploadType;
  onChange: (fileList: FileList) => void;
}) => {
  const uploadName = uploadType === 'webgl' ? 'フォルダ' : 'Zipファイル';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hasHiddenFolderDropped, setHasHiddenFolderDropped] = useState(false);
  const onFilesDrop = (e: ChangeEvent<HTMLInputElement>) => {
    const fileInput = fileInputRef.current;
    if (fileInput === null) {
      return;
    }
    setHasHiddenFolderDropped(false);
    const fileList = e.currentTarget.files;
    if (fileList === null) {
      onChange(new FileList());
      return;
    }
    const transformed = transformFileList(fileList, uploadType);
    if (uploadType === 'webgl' && transformed.length < fileList.length) {
      setHasHiddenFolderDropped(true);
    }
    onChange(transformed);
    fileInput.files = transformed;
  };
  const startDrag = () => setDragging(true);
  const finishDrag = () => setDragging(false);
  useEffect(() => {
    const fileInput = fileInputRef.current;
    if (fileInput !== null) {
      fileInput.addEventListener('dragenter', startDrag);
      fileInput.addEventListener('dragleave', finishDrag);
      fileInput.addEventListener('drop', finishDrag);
    }
    return () => {
      fileInput?.removeEventListener('dragenter', startDrag);
      fileInput?.removeEventListener('dragleave', finishDrag);
      fileInput?.removeEventListener('drop', finishDrag);
    };
  }, []);
  return (
    <div className="row card-panel">
      <h4 className="mt-0">{title}</h4>
      {hasHiddenFolderDropped ? (
        <blockquote className="webgl">
          隠しフォルダ(.gitなど)内のフォルダはアップロードされません。
        </blockquote>
      ) : null}
      <div
        className={`input-field relative h-40 ${
          dragging
            ? 'border-4 border-solid border-cyan-500 bg-cyan-300'
            : 'border-2 border-dashed border-gray-400'
        }`}
      >
        <input
          className="validate absolute h-full w-full cursor-pointer opacity-0"
          type="file"
          name={uploadType}
          ref={fileInputRef}
          onChange={onFilesDrop}
          {...(uploadType === 'webgl'
            ? { webkitdirectory: '' }
            : { accept: '.zip' })}
        />
        <div className="flex h-full w-full flex-col items-center justify-center">
          <h6>ここに{uploadName}をドロップ</h6>
          <div>または</div>
          <h6>クリックして{uploadName}を選択</h6>
        </div>
      </div>
    </div>
  );
};
