# 開発メモ

## req.session の型 (2023/02/19 時点)

```ts
type Session = {
  cookie: {
    path: string;
    _expires: Date;
    originalMaxAge: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
  };
  passport: {
    user: {
      id: string;
      name: string;
      avatar_url: string;
      type: string;
    };
  };
  csrfToken: string | undefined;
  csrfTokenWithHash: string | undefined;
};
```
