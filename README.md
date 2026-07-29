# 하레하레 케이크 메뉴판

점포별 케이크 상품과 가격을 편집하고 A4/A5로 인쇄할 수 있는 메뉴판 웹앱입니다.

## 바로 접속하는 주소

- GitHub Pages: `https://harebakery-cmd.github.io/cake-menu/`
- 기존 비공개 사이트: `https://harehare-cake-menu.avionenpapier1.chatgpt.site`

`npm run dev`나 `localhost` 실행은 필요하지 않습니다.

## GitHub Pages 처음 설정

1. 이 저장소의 **Settings**를 엽니다.
2. 왼쪽 메뉴에서 **Pages**를 누릅니다.
3. **Build and deployment**의 **Source**를 `Deploy from a branch`로 선택합니다.
4. **Branch**는 `main`, 폴더는 `/docs`를 선택합니다.
5. **Save**를 누르고 1~3분 기다립니다.
6. `https://harebakery-cmd.github.io/cake-menu/`에 접속합니다.

화면에 이전 안내문이 계속 보이면 `Ctrl + F5`로 새로고침합니다.

## GitHub에 제품 사진 올리기

### 메뉴판에서 자동 업로드

1. 메뉴판의 **점포 저장 → GitHub 사진 자동 업로드**를 엽니다.
2. **토큰 만들기**를 눌러 `harebakery-cmd/cake-menu` 저장소만 선택합니다.
3. Repository permissions에서 **Contents: Read and write**만 허용합니다.
4. 생성된 토큰을 메뉴판에 붙여 넣고 **연결 확인**을 누릅니다.
5. 이후 제품 사진을 선택하거나 끌어놓으면 자동 축소·업로드·주소 입력이 한 번에 처리됩니다.

제품 사진 파일명은 메뉴 순서에 맞춰 `product-01.webp`, `product-02.webp`처럼 자동으로 정해집니다. 로고는 `logo.webp`, 2단 케이크 사진은 `two-tier-cake.webp`로 올라갑니다. 토큰은 점포 저장 파일에는 포함되지 않습니다. 개인 PC에서는 **이 PC에서 연결 유지**를 선택하면 다음 접속에도 자동 업로드가 유지됩니다.

### GitHub에서 직접 업로드

1. 이 저장소의 `public/images` 폴더를 엽니다.
2. **Add file → Upload files**를 누릅니다.
3. 제품 사진을 올리고 **Commit changes**를 누릅니다.
4. 메뉴판의 상품 편집에서 **GitHub 제품 이미지 주소**에 아래 형식으로 입력합니다.

```text
https://raw.githubusercontent.com/harebakery-cmd/cake-menu/main/public/images/파일명.png
```

파일명 앞에 `01-`, `02-`, `03-`처럼 번호를 붙이면 사진을 찾기 쉽습니다. 번호는 메뉴판의 제품명이나 순서를 자동으로 바꾸지 않습니다.

같은 방법으로 로고와 2단 케이크 사진도 GitHub 주소를 사용할 수 있습니다. URL은 점포 저장 파일에 포함되므로 다른 PC에서 불러와도 사진을 다시 등록할 필요가 없습니다.

## 점포 데이터를 다른 PC로 옮기기

1. 기존 PC에서 **점포 저장 → 저장 파일 내보내기**
2. 다른 PC에서 메뉴판 주소 접속
3. **점포 저장 → 저장 파일 불러오기**

GitHub 이미지 주소를 사용한 사진은 저장 파일을 불러오면 자동으로 표시됩니다.

## 앱 파일을 업데이트할 때

새 ZIP을 받은 경우 압축을 풀고, 그 안의 파일과 폴더를 저장소 첫 화면에 모두 업로드합니다. 같은 이름의 파일은 새 파일로 바꿉니다. 저장소 첫 화면에 `docs` 폴더가 보여야 합니다.
