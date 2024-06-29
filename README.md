# ㅇㅈ 봇 (Slack)

매일 매일 챌린지를 트레킹 하는 인증봇 입니다.

## 설치

코드를 다운로드하여 아래 과정을 따라 무료로 배포한 후 사용할 수 있습니다.

### 사전 준비

1. 이 레포지토리를 fork 하고 clone 합니다.

1. Vercel에 가입하여 계정을 세팅합니다.

1. Supabase에 가입합니다.

### 환경 변수 설정

1. `.env.example` 파일을 복사해서 `.env` 로 이름을 변경합니다. (아래 값들은 예시)

```bash
OPENAI_API_KEY=afeifajosejfl
SLACK_BOT_TOKEN=xoxb-aeifoajl
SLACK_SIGNING_SECRET=aoeijfoajsl
SLACK_ADMIN_MEMBER_ID=MEIfaoIJFE

SUPABASE_SERVICE_ROLE_KEY=aaaaaaaaaaak

SERVER_BASE_URL=http://localhost:3000
```

#### OpenAI API Key (필요없음)

- [OpenAI API Keys](https://platform.openai.com/api-keys)에서 키를 발급받아 복사해옵니다.

#### Slack Bot Token & Signing Secret

[Slack API Apps Page](https://api.slack.com/apps)로 이동해서 아래 과정을 통해 키값들을 가지고 옵니다.

- Create new App
  - From Scratch
  - Name your app & pick a workspace
- Go to OAuth & Permissions
  - Scroll to scopes
  - Add the following scopes
    - `app_mentions:read`
    - `channels:history`
    - `chat:write`
    - `commands`
  - Click "Install to Workplace"
  - "Intall to Workplace" 에서 에러가 난다면, 'App Home' -> App Display Name의 edit 버튼 -> 이름들 설정을 먼저 진행합니다.
  - Copy **Bot User OAuth Token**
  - Add the token to Vercel's environment variables as `SLACK_BOT_TOKEN`
- signing secret 가져오기 (필요없음)
  - Basic Information --> App Credentials --> Copy **Signing Secret**
  - Add the secret to Vercel's environment variables as `SLACK_SIGNING_SECRET`

#### Admin's Slack Member ID

- Click on your profile picture in Slack and click **Profile**.
- Click on the three dots in the middle right corner and select **Copy member ID**.
- Add the ID to Vercel's environment variables as `SLACK_ADMIN_MEMBER_ID`.

#### Supabase 세팅

챌린지 수행기록을 저장하기 위해서 Supabase의 PostgreSQL 데이터베이스를 사용합니다.

- New Project를 눌러 새로운 프로젝트를 만듭니다.
  - Project를 만들 때 보여지는 database password는 어디 잘 기록해둡니다.
- 왼쪽 아래 Settings -> Configuration - API 를 누르고 Service role key를 복사해서 env에 적어 넣습니다.

- 왼쪽 Navbar의 SQL Editor를 열고 아래 내용을 입력하여 table을 만듭니다.

```sql
create table
  public.challenges (
    id text not null,
    created_at timestamp with time zone not null default now(),
    channel_id text not null,
    name text not null,
    constraint challenges_pkey primary key (id)
  ) tablespace pg_default;

  create table
  public.daily_checks (
    id text not null,
    created_at timestamp with time zone not null default now(),
    challenge_id text not null,
    slack_user_id text not null,
    constraint daily_checks_pkey primary key (id),
    constraint daily_checks_challenge_id_fkey foreign key (challenge_id) references challenges (id) on update cascade on delete cascade,
    constraint daily_checks_slack_user_id_fkey foreign key (slack_user_id) references slack_users (id) on update cascade on delete cascade
  ) tablespace pg_default;

  create table
  public.slack_users (
    id text not null,
    created_at timestamp with time zone not null default now(),
    slack_user_id text not null,
    slack_user_name text not null,
    constraint slack_users_pkey primary key (id)
  ) tablespace pg_default;
```

### App 배포

clone 받은 git repository의 root에서 [Vercel CLI](https://vercel.com/docs/cli)를 이용해서 배포합니다.

```
(root)$ vercel --prod
```

### Slack Events 활성화

배포한 후, [Slack API Apps Page](https://api.slack.com/apps)로 가서 app을 선택하고 아래를 진행합니다.:

- Go to **Event Subscriptions** and enable events.
- Add the following URL to **Request URL**:
  - `https://<your-vercel-app>.vercel.app/api/events`
  - Make sure the URL is verified, otherwise check out [Vercel Logs](https://vercel.com/docs/observability/runtime-logs) for troubleshooting.
  - Subscribe to bot events by adding:
    - `app_mention`
    - `channel_created`
  - Click **Save Changes**.
- Slack requires you to reinstall the app to apply the changes.

### Slack Command 활성화

역시 [Slack API Apps Page](https://api.slack.com/apps)로 가서 app을 선택하고 아래를 진행합니다.:

- **Slash Command** 를 누르고 새로운 커맨드를 추가합니다.
- 커맨드는 '/ㅇㅈ' 으로 적고,
- Request URL은 위에서와 같이 `https://<your-vercel-app>.vercel.app/api/events` 로 세팅합니다.
- Short Description은 '인증해드립니다'.
- Save를 눌러 저장해주세요.

## 로컬 개발 환경

#### ngrok을 이용한 터널링

- 로컬에서 실행

```sh
(root)$ pnpm i -g vercel
(root)$ pnpm vercel dev --listen 3000 --yes
```

```sh
$ ngrok http --domain=<ngrok-free-domain> 3000
```

or

```sh
npx localtunnel --port 3000
```

[subscription URL](./README.md/#enable-slack-events)을 <ngrok-free-domain>으로 변경해주세요.

## 참고자료

- https://vercel.com/docs/functions/runtimes/node-js node-js runtime에 대한 내용.

- 만약 express를 사용하고 싶다면, See https://vercel.com/guides/using-express-with-vercel
