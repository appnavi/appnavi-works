export const FormatDate = ({ date }: { date: Date }) => {
  return (
    <>
      {date.getFullYear()}年{date.getMonth()}月{date.getDate()}日
      {date.getHours()}時{date.getMinutes()}分{date.getSeconds()}秒
    </>
  );
};
