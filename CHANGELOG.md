# Change Log

주요한 변경 사항들을 기록하는 문서입니다.

포맷은 다음 사이트의 포맷을 따릅니다. [Keep a Changelog](http://keepachangelog.com/)
버저닝은 [Semantic Versioning](http://semver.org/)을 따릅니다.

## [1.0.8] - 2024-08-03

### Add

- 연속 일수(Streak)가 추가되었습니다.

## [1.0.7] - 2024-08-01

### Chore

- 달력에 유저 네임이 추가되었습니다.

## [1.0.6] - 2024-07-17

### Added

- challenges table에 `vacation_per_month`가 추가되었습니다. 해당 일 수 만큼 휴가 사용이 가능합니다.
- 휴가 사용은 '/ㅎㄱ'로 가능합니다.

## [1.0.5] - 2024-06-29

### Added

- challenges table에 cutoff_hour가 추가되었습니다. 하루가 끝나는 시간을 설정할 수 있습니다.
- 예를들어 cutoff_hour가 4라면 4AM까지의 ㅇㅈ이 전날 ㅇㅈ으로 취급됩니다.
- cutoff_hour가 -4라면 8PM부터는 내일로 취급됩니다.

### Chore

- Test code가 추가되었습니다.

## [1.0.4] - 2024-06-29

### Changed

- Vercel API server의 region을 icn1 (South Korea)로 설정합니다.

## [1.0.3] - 2024-05-25

### Added

- /ㄱㅈ (공지) 커맨드가 추가되었습니다. ADMIN 맴버만 권한이 있습니다.
- package.json의 버전이 공지에 포함됩니다.

## [1.0.2] - 2024-05-24

### Added

- 인증샷이 담긴 메세지에 리엑션을 남깁니다. (private 채널이라면 채널의 integration에 bot을 추가해주어야합니다.)

## [1.0.1] - 2024-05-24

### Changed

- String을 업데이트해서 좀 더 친근한 표현으로 대답합니다.

### Fixed

- `getMonth()`가 zero-base 여서 5월인데 4월이라고 뜨는 오류를 수정

## [1.0.0] - 2024-05-18

슬랙의 `/ㅇㅈ` 커맨드로 출석체크를 하고 달력을 출력하도록 구현.

### Added

- ㅇㅈ 커맨드 구현의 초기 버전 코드
