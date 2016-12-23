# TODO: написать нормальную документацию

Старт дев версии `npm start`  
Сборка для кордовы `npm run dist`

## Генерация ключа
keytool -genkey -v -keystore cafeassorti.keystore -alias cafeassorti -keyalg RSA -keysize 2048 -validity 10000  
Пароль от всего: `bGHBmcX8mI1t`

## Репозиторий для сборки в Phonegap Build
https://github.com/ugraweb/cordova-cafeassorti

Чтобы собрать проект сначала выполнить `npm run dist`, создать файл `.gitignore` следующего содержания:
```
platforms
plugins
```
и все что в папке `cordova` запушить в репозиторий. Сборка проекта осуществляется в облаке Phonegap Build.
