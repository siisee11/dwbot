# Change Log

주요한 변경 사항들을 기록하는 문서입니다.

포맷은 다음 사이트의 포맷을 따릅니다. [Keep a Changelog](http://keepachangelog.com/)
버저닝은 [Semantic Versioning](http://semver.org/)을 따릅니다.

## [1.0.1] - 2024-05-24

### Changed

- String을 업데이트해서 좀 더 친근한 표현으로 대답합니다.

### Fixed

- `getMonth()`가 zero-base 여서 5월인데 4월이라고 뜨는 오류를 수정

## [1.0.0] - 2024-05-18

슬랙의 `/ㅇㅈ` 커맨드로 출석체크를 하고 달력을 출력하도록 구현.

### Added

- ㅇㅈ 커맨드 구현의 초기 버전 코드
