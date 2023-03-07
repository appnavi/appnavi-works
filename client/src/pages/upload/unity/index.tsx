import { FormEvent, useRef, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { z } from 'zod';
import { useMessageDialogContext } from '../../../context/DialogsContext/MessageDialog';
import { useQueryContext } from '../../../context/QueryContext';
import { FilesPicker } from './FilesPicker';
import { Preview } from './Preview';

const Response = z.object({
  paths: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
});

function alertBeforeLeave(event: BeforeUnloadEvent) {
  event.preventDefault();
  event.returnValue = '';
}

const PreventPageLeave = ({
  shouldPreventLeave: shouldPrevent,
}: {
  shouldPreventLeave: boolean;
}) => {
  useEffect(() => {
    if (shouldPrevent) {
      window.addEventListener('beforeunload', alertBeforeLeave);
      return () => {
        window.removeEventListener('beforeunload', alertBeforeLeave);
      };
    }
  }, [shouldPrevent]);
  return null;
};

// TODO：defaultCreatorIdの取得、表示
// TODO：コード分割
export const UploadUnityPage = () => {
  const { user } = useQueryContext();
  if (user === null) {
    return <Navigate to="/auth" />;
  }
  const navigate = useNavigate();
  const { showMessageDialog } = useMessageDialogContext();
  const { csrfToken } = useQueryContext();
  const [uploading, setUploading] = useState(false);
  const [creatorId, setCreatorId] = useState<string>('');
  const [workId, setWorkId] = useState<string>('');
  const [webglFiles, setWebglFiles] = useState<FileList | undefined>(undefined);
  const [windowsFiles, setWindowsFiles] = useState<FileList | undefined>(
    undefined,
  );
  const formRef = useRef<HTMLFormElement | null>(null);
  const showUnknownErrorDialog = (errorText: string) => {
    showMessageDialog({
      title: 'アップロードに失敗しました',
      content: (
        <>
          <p>想定外のエラーが発生しました。</p>
          <p>{errorText}</p>
        </>
      ),
    });
  };
  const handleSubit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = formRef.current;
    if (formElement === null) {
      return;
    }
    setUploading(true);
    const formData = new FormData(formElement);
    const response = await fetch('/api/upload/unity', {
      credentials: 'same-origin',
      method: 'POST',
      body: formData,
      headers: {
        'CSRF-Token': csrfToken,
        'x-creator-id': creatorId,
        'x-work-id': workId,
      },
    });
    setUploading(false);
    const { status } = response;
    if (status === 401) {
      showMessageDialog({
        title: 'アップロードに失敗しました。',
        content: <p>ログインしなおす必要があります。</p>,
        onClose: () => {
          navigate('/auth');
        },
      });
      return;
    }
    const text = await response.text();
    const responseBody = Response.safeParse(JSON.parse(text));
    if (!responseBody.success) {
      showUnknownErrorDialog(await response.text());
      return;
    }
    const { paths, errors } = responseBody.data;
    if (status === 200) {
      if (errors !== undefined || paths === undefined) {
        showUnknownErrorDialog(await response.text());
        return;
      }
      showMessageDialog({
        title: 'アップロード成功',
        content: (
          <>
            {paths.map((p) => {
              const url = `${location.origin}${p}`;
              return (
                <p key={p}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                  にアップロードしました。
                </p>
              );
            })}
          </>
        ),
      });
      return;
    }
    if (errors === undefined || paths !== undefined) {
      showUnknownErrorDialog(await response.text());
      return;
    }
    if (status == 400) {
      showMessageDialog({
        title: 'アップロードに失敗しました。',
        content: (
          <>
            {errors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </>
        ),
      });
      return;
    }
    showUnknownErrorDialog(await response.text());
  };
  return (
    <div className="container">
      <PreventPageLeave shouldPreventLeave={uploading} />
      <h3 className="header">Unityゲームを投稿する</h3>
      <form
        action="webgl"
        method="POST"
        encType="multipart/form-data"
        onSubmit={handleSubit}
        ref={formRef}
      >
        <div className="row card-panel">
          <div className="input-field">
            <input
              id="creator_id"
              type="text"
              className="validate"
              name="creator_id"
              pattern="^[0-9a-z\-]+$"
              required
              aria-required
              value={creatorId}
              onChange={(e) => setCreatorId(e.target.value)}
            />
            <label htmlFor="creator_id">作者ID</label>
            <span
              className="helper-text"
              data-error="数字・アルファベット小文字・ハイフンのみで入力してください"
              data-success="問題なし"
            ></span>
          </div>
          <div className="input-field">
            <input
              id="work_id"
              type="text"
              className="validate"
              name="work_id"
              pattern="^[0-9a-z\-]+$"
              required
              aria-required
              value={workId}
              onChange={(e) => setWorkId(e.target.value)}
            />
            <label htmlFor="work_id">作品ID</label>
            <span
              className="helper-text"
              data-error="数字・アルファベット小文字・ハイフンのみで入力してください"
              data-success="問題なし"
            ></span>
          </div>
        </div>
        <FilesPicker
          title="WebGL(フォルダ)"
          uploadType="webgl"
          onChange={setWebglFiles}
        />
        <FilesPicker
          title="Windows(Zipファイル)"
          uploadType="windows"
          onChange={setWindowsFiles}
        />
        <Preview
          creatorId={creatorId}
          workId={workId}
          webglFiles={webglFiles}
          windowsFiles={windowsFiles}
        />
        <div className="row center">
          <button
            type="submit"
            className={`btn ${uploading ? 'disabled' : ''}`}
          >
            アップロードする
          </button>
        </div>
      </form>
      <div className={`progress ${uploading ? '' : 'hide'}`}>
        <div className="indeterminate"></div>
      </div>
    </div>
  );
};
