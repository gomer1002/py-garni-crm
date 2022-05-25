# py-garni-crm

[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

Дипломный проект по теме "Разработка системы управления для ресторанно-гостиничного комплекса "Гарни".

## Запуск проекта на локальном сервере Windows

Для запуска проекта необходимо запустить командную строку в папке проекта. После чего создать и активировать виртуальное окружение.

Создание виртуального окружения:

```sh
py -m venv ./env
```

Активация виртуального окружения:

```sh
.\env\Scripts\activate
```

После активации виртуального окружения необходимо произвести установку требуемых для работы системы пакетов.

Установка пакетов, необходимых для работы проекта:

```sh
py -m pip install -r ./requirements.txt
```

Также необходимо установить redis-server. Сделать это можно с помощью [данной инструкци](https://developer.redis.com/create/windows/).

>В данной инструкции необходимо после открытия магазина приложений с помощью поиска найти и установить приложение `Ubuntu` любой версии. После чего произвести установку и запуск redis-server'а через это приложение.

Настройка config файла:

В папке проекта необходимо переименовать файл _config_sample.json_ в _config.json_.

Для получения конфигурационных данных необходимо зарегистрироваться и создать проект в [Firebase Console](https://console.firebase.google.com). После создания проекта необходимо создать Web приложение на главной странице [Firebase Console](https://console.firebase.google.com). После создания приложения необходимо перейти в настройки проекта, во вкладку `General` и прокрутить страницу до разреда с приложениями. В данном разделе необходимо выбрать только что созданное приложение и из подраздела `SDK setup and configuration` необходимо взять конфигурационные данные из константы `firebaseConfig` и записать их в файл _config.json_ в соответствии с названиями полей.

Для получения конфигурационных данных для заполнения `serviceAccount` необходимо перейти в раздел `Service accounts` в настройках проекта и нажать кнопку `Generate new private key`. Данные из полученного json файла скопировать в _config.json_ в поле serviceAccount`.

После получения всех конфигурационных данных необходимо создать базу данных `Cloud Firestore`. Для этого необходимо выбрать в меню в левой части страницы пункт `Firestore database` и создать базу данных.

Далее необходимо заполнить поля с ключами.

Создание пары ключей `DER_BASE64_ENCODED_PUBLIC_KEY` и `DER_BASE64_ENCODED_PRIVATE_KEY` для push-уведомлений:

```sh
vapid --applicationServerKey
```

Полученный Application server key необходимо записать в `DER_BASE64_ENCODED_PUBLIC_KEY`. Ключ из _private_key.pem_ необходимо записать в `DER_BASE64_ENCODED_PRIVATE_KEY`, удалив все переходы на новую строку.

Пример:

>Файл private_key.pem:
>
>```text
>-----BEGIN PRIVATE KEY-----
>MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgdrFMN8AV6jgkjjHE
>NmIn0pHrbMcKF7bM5gU486uTiPWhRANCAARKYpcKrbMw2o/gc1xzb+NRe3eunqPZ
>Ld1JDVUv6KrNOwcjT2zJ7+BxF+yWgCHErvNOIyZr9FJfbwyiAe5MwAtg
>-----END PRIVATE KEY-----
>```
>
>Переменная DER_BASE64_ENCODED_PRIVATE_KEY:
>
>```text
>MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgdrFMN8AV6jgkjjHENmIn0pHrbMcKF7bM5gU486uTiPWhRANCAARKYpcKrbMw2o/gc1xzb+NRe3eunqPZLd1JDVUv6KrNOwcjT2zJ7+BxF+yWgCHErvNOIyZr9FJfbwyiAe5MwAtg
>```

Для заполнения `JWT_SECRET_KEY` можно удалить полученные на прошлом шаге _private_key.pem_ и _public_key.pem_ и еще раз воспользоваться командой

```sh
vapid --applicationServerKey
```

Полученный новый Application server key записать в `JWT_SECRET_KEY`.

Значение `SYS_PEPPER` может быть любой строкой, не длиннее 65 символов. Данное значение используется для шифрования паролей.

Значение `REDIS_URL` является ссылкой на redis сервер, локальный или внешний.

Значение `SYS_ROOT_URL` является полной внешней ссылкой на этот проект.

После заполнения всех конфигурационных параметров система готова к работе. Следующим шагом необходимо создать суперпользователя для доступа к административной панели.

Создание суперпользователя для доступа к административной панели системы:

>Использоваие команды создания суперпользователя
>
>```text
>usage: manage.py create_superuser [-?] [-p PASSWORD] [-t PHONE] [-n NAME]
>
>Создание суперпользователя
>
>options:
>  -?, --help            show this help message and exit
>  -p PASSWORD, --pass PASSWORD
>                        Пароль пользователя
>  -t PHONE, --tel PHONE
>                        Телефон пользователя
>  -n NAME, --name NAME  Имя пользователя, по умолчанию 'Admin'
>```

```sh
py .\manage.py create_superuser --name Admin --tel 71234567890 --pass adminadmin
```

После создания суперпользователя проект готов к запуску.

Запуск проекта:

```sh
py .\manage.py runserver
```
