package ru.rtlabs.elections.voting.box.dto;

import java.io.Serializable;

public enum ApiResponseCode implements Serializable {
    INTERNAL_SERVER_ERROR(7, "Неизвестная ошибка сервера"),
    NOT_FOUND(8, "Запрашиваемый ресурс не найден"),
    METHOD_NOT_ALLOWED(18, "неверный HTTP метод"),
    UNSUPPORTED_MEDIA_TYPE(19, "Неподдерживаемый тип контента"),
    NOT_ACCEPTABLE(20, "Неприемлемый тип ответа"),
    BAD_REQUEST(21, "Невалидный HTTP запрос"),
    SERVICE_UNAVAILABLE(22, "Сервис недоступен"),
    VOTING_SERVICE_EXCHANGE_ERROR(97, "Ошибка взаимодействия с сервисом голосования"),
    CRYPTO_SERVICE_EXCHANGE_ERROR(98, "Ошибка взаимодействия с крипто-сервисом"),
    ELECTIONS_STOPPED(150, "Голосование завершено. Отправка бюллетеня невозможна."),
    BLIND_SIGN_VERIFICATION_ERROR(151, "Ошибка при проверке слепой подписи. Отправка голоса невозможна"),
    CACHE_CONFIGURATION_ERROR(152, "Ошибка настройки кеша"),
    VOTE_ALREADY_MADE(153, "Код доступа к бюллетеню уже использовался на этом голосовании.");



    private int code;
    private String description;

    ApiResponseCode(int code, String description) {
        this.code = code;
        this.description = description;
    }

    public int getCode() {
        return code;
    }

    public String getDescription(Object... params) {
        if (params == null || params.length == 0) {
            return description;
        } else {
            return String.format(description, params);
        }
    }
}
