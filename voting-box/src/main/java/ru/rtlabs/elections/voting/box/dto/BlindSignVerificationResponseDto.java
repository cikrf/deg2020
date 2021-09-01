package ru.rtlabs.elections.voting.box.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
@NoArgsConstructor
@AllArgsConstructor
public class BlindSignVerificationResponseDto {

    private boolean verified;

}
