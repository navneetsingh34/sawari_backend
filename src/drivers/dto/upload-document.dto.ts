/**
 * Upload Document DTO
 * 
 * Data transfer object for document uploads.
 */

import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum DocumentType {
    DRIVER_LICENSE = 'driverLicense',
    INSURANCE_POLICY = 'insurancePolicy',
    VEHICLE_REGISTRATION = 'vehicleRegistration',
    PROFILE_PHOTO = 'profilePhoto',
}

export class UploadDocumentDto {
    @IsEnum(DocumentType)
    @IsNotEmpty()
    documentType: DocumentType;

    @IsString()
    @IsNotEmpty()
    base64Data: string; // Base64 encoded file data

    @IsString()
    @IsNotEmpty()
    fileName: string;

    @IsString()
    @IsNotEmpty()
    mimeType: string; // e.g., 'image/jpeg', 'application/pdf'
}

export class DocumentResponseDto {
    url: string;
    fileName: string;
    mimeType: string;
    uploadedAt: Date;
    isVerified: boolean;
}
