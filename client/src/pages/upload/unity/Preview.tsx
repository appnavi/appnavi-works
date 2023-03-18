import { URL_PREFIX_WORK } from '@common/constants';
import M from '@materializecss/materialize';
import { useEffect, useRef, useState, ReactNode } from 'react';
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md';
import { UploadType } from './common';
type FileTreeNode = {
  segment: string;
  children: FileTreeNode[];
};
// type FileTreeObject = {
//   [key: string]: File | FileTreeObject
// }

function filesToTree(files: File[]) {
  const tree: FileTreeNode = {
    segment: '',
    children: [],
  };
  for (const file of files) {
    const segments = file.webkitRelativePath.split('/');
    segments.shift();
    let children = tree.children;
    for (let i = 0; i < segments.length; ++i) {
      const segment = segments[i];
      let child = children.find((x) => x.segment === segment);
      if (child === undefined) {
        child = {
          segment: segment,
          children: [],
        };
        children.push(child);
      }
      children = child.children;
    }
  }
  return tree;
}

const FileTreeWebGLNode = ({ tree }: { tree: FileTreeNode }) => {
  const { segment, children } = tree;
  return (
    <FileTreeLi>
      {segment}
      <FileTreeUl>
        {children.map((child) => (
          <FileTreeWebGLNode key={child.segment} tree={child} />
        ))}
      </FileTreeUl>
    </FileTreeLi>
  );
};

const FileTreeWebGL = ({
  files,
  uploadType,
}: {
  files: File[];
  uploadType: UploadType;
}) => {
  const { children } = filesToTree(files);
  return (
    <FileTreeLi>
      {uploadType}
      {children.length > 0 ? (
        <FileTreeUl>
          {children.map((child) => (
            <FileTreeWebGLNode key={child.segment} tree={child} />
          ))}
        </FileTreeUl>
      ) : null}
    </FileTreeLi>
  );
};

const FileTreeWindows = ({
  files,
  uploadType,
}: {
  files: File[];
  uploadType: UploadType;
}) => {
  return (
    <FileTreeLi>
      {uploadType}
      {files.length > 0 ? (
        <FileTreeUl>
          <FileTreeLi>{files[0].name}</FileTreeLi>
        </FileTreeUl>
      ) : null}
    </FileTreeLi>
  );
};

// http://kachibito.net/css/file-tree-css を参考に作成
const FileTreeUl = ({ children }: { children: ReactNode }) => {
  return <ul className="list-none pl-[5px]">{children}</ul>;
};
// http://kachibito.net/css/file-tree-css を参考に作成
const FileTreeLi = ({ children }: { children: ReactNode }) => {
  return (
    <li className="relative box-border py-[5px] pl-[15px] before:absolute before:top-[15px] before:left-0 before:m-auto before:h-[1px] before:w-[10px] before:bg-gray-500 before:content-[''] after:absolute after:top-0 after:bottom-0 after:left-0 after:h-full after:w-[1px] after:bg-gray-500 after:content-[''] last:after:h-[15px]">
      {children}
    </li>
  );
};

const FileTree = ({
  files,
  uploadType,
}: {
  files: File[];
  uploadType: UploadType;
}) => {
  if (uploadType === 'windows') {
    return <FileTreeWindows files={files} uploadType={uploadType} />;
  }
  return <FileTreeWebGL files={files} uploadType={uploadType} />;
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
  const collapsibleRef = useRef<HTMLUListElement>(null);
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
            {location.origin}
            {URL_PREFIX_WORK}/
            <span className="creator_id">
              {creatorId.length === 0 ? '(作者ID)' : creatorId}
            </span>
            /
            <span className="work_id">
              {workId.length === 0 ? '(作品ID)' : workId}
            </span>
            /
          </div>
          <div className="relative bg-white leading-6">
            <FileTreeUl>
              <FileTree
                files={Array.from(webglFiles ?? [])}
                uploadType="webgl"
              />
              <FileTree
                files={Array.from(windowsFiles ?? [])}
                uploadType="windows"
              />
            </FileTreeUl>
          </div>
        </div>
      </li>
    </ul>
  );
};
