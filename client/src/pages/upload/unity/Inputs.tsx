import { idRegexPattern } from '@common/constants';
import M from '@materializecss/materialize';
import { useEffect } from 'react';
import { trpc } from '../../../trpc';

const BaseInput = ({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="input-field">
      <input
        id={name}
        type="text"
        className="validate"
        name={name}
        pattern={idRegexPattern}
        required
        aria-required
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <label htmlFor={name}>{label}</label>
      <span
        className="helper-text"
        data-error="数字・アルファベット小文字・ハイフンのみで入力してください"
        data-success="問題なし"
      ></span>
    </div>
  );
};

export const WorkIdInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <BaseInput name="workId" label="作品ID" value={value} onChange={onChange} />
  );
};

export const CreatorIdInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const { data: defaultCreatorId } =
    trpc.account.getDefaultCreatorId.useQuery();
  useEffect(() => {
    M.updateTextFields();
  }, [value]);
  useEffect(() => {
    onChange(defaultCreatorId ?? '');
  }, [defaultCreatorId]);
  return (
    <BaseInput
      name="creatorId"
      label="作者ID"
      value={value}
      onChange={onChange}
    />
  );
};
