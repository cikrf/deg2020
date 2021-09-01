package ru.rtlabs.elections.voting.box.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

@Slf4j
public class LoggingCacheErrorHandler implements CacheErrorHandler {

    @Override
    public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
        log.error(String.format("Error while getting object from cache. Key: %s. Cache region: %s. Exception message: %s", key, cache.getName(), exception.getMessage()), exception);
        throw exception;
    }

    @Override
    public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
        log.error(String.format("Error while putting object into cache. Key: %s. Cache region: %s. Exception message: %s", key, cache.getName(), exception.getMessage()), exception);
        throw exception;
    }

    @Override
    public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
        log.error(String.format("Evicting cache error. Key: %s. Cache region: %s. Exception message: %s", key, cache.getName(), exception.getMessage()), exception);
        throw exception;
    }

    @Override
    public void handleCacheClearError(RuntimeException exception, Cache cache) {
        log.error(String.format("Clearing cache error. Cache region: %s. Exception message: %s", cache.getName(), exception.getMessage()), exception);
        throw exception;
    }
}
