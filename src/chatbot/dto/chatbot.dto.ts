import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ example: 'How do I add a new payment method?' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
