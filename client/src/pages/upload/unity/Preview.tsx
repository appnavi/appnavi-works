import M from '@materializecss/materialize';
import { useEffect, useRef, useState } from 'react';
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md';
import { UploadType } from './common';

const FileTree = ({
  files,
  uploadType,
}: {
  files: File[];
  uploadType: UploadType;
}) => {
  return (
    <li className="ml-4">
      {uploadType}/
      <ul>
        {files.map((f) => {
          const name =
            uploadType === 'webgl'
              ? f.webkitRelativePath?.replace(/^[^/]+\//, '')
              : f.name;
          return (
            <li key={name} className="ml-4">
              {name}
            </li>
          );
        })}
      </ul>
    </li>
  );
};

export const Preview = ({
  creatorId,
  workId,
  webglFiles,
  windowsFiles,
}: {
  creatorId: string;
  workId: string;
  webglFiles: FileList | undefined;
  windowsFiles: FileList | undefined;
}) => {
  const collapsibleRef = useRef<HTMLUListElement | null>(null);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  useEffect(() => {
    const collapsibleElement = collapsibleRef.current;
    if (collapsibleElement !== null) {
      M.Collapsible.init(collapsibleElement, {
        onOpenStart: () => setCollapsibleOpen(true),
        onCloseStart: () => setCollapsibleOpen(false),
      });
    }
  }, []);
  return (
    <ul className="collapsible" ref={collapsibleRef}>
      <li>
        <div className="collapsible-header">
          <i>
            {collapsibleOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
          </i>
          <span>プレビュー</span>
        </div>
        <div className="collapsible-body">
          <div className="file-list-header">
            {location.origin}/works/
            <span className="creator_id">
              {creatorId.length === 0 ? '(作者ID)' : creatorId}
            </span>
            /
            <span className="work_id">
              {workId.length === 0 ? '(作品ID)' : workId}
            </span>
            /
          </div>
          <div className="file-list">
            <ul>
              <FileTree
                files={Array.from(webglFiles ?? [])}
                uploadType="webgl"
              />
              <FileTree
                files={Array.from(windowsFiles ?? [])}
                uploadType="windows"
              />
            </ul>
          </div>
        </div>
      </li>
    </ul>
  );
};
