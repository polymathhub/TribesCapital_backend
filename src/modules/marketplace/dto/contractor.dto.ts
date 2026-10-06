import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SaveContractorProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  services!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  teamSize?: string;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2200)
  foundedYear?: number;
}

export class CreateContractorReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;
}