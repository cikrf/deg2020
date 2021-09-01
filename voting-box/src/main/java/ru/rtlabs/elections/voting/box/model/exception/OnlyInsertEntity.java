package ru.rtlabs.elections.voting.box.model.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.EntityListeners;
import javax.persistence.MappedSuperclass;
import java.time.LocalDateTime;

@EqualsAndHashCode(callSuper = true)
@MappedSuperclass
@Data
@SuperBuilder
@EntityListeners(AuditingEntityListener.class)
@Accessors(chain = true)
@NoArgsConstructor
public abstract class OnlyInsertEntity extends BaseEntity {

    public static final String CREATED_AT_FN = "createdAt";

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

}
