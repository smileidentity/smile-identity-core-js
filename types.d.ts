declare module "constants" {
    /**
     * The type of verification job to be performed
     */
    export type IMAGE_TYPE = number;
    export namespace IMAGE_TYPE {
        const SELFIE_IMAGE_FILE: number;
        const ID_CARD_IMAGE_FILE: number;
        const SELFIE_IMAGE_BASE64: number;
        const ID_CARD_IMAGE_BASE64: number;
        const LIVENESS_IMAGE_FILE: number;
        const ID_CARD_BACK_IMAGE_FILE: number;
        const LIVENESS_IMAGE_BASE64: number;
        const ID_CARD_BACK_IMAGE_BASE64: number;
    }
    /**
     * The type of verification job to be performed
     */
    export type JOB_TYPE = number;
    export namespace JOB_TYPE {
        const BIOMETRIC_KYC: number;
        const SMART_SELFIE_REGISTRATION: number;
        const SMART_SELFIE_AUTHENTICATION: number;
        const ENHANCED_KYC: number;
        const DOCUMENT_VERIFICATION: number;
        const BUSINESS_VERIFICATION: number;
    }
    export const sidServerMapping: {
        0: string;
        1: string;
    };
}
declare module "helpers" {
    /**
     * Converts a numeric key to a smile server URI, or
     * returns the original URI.
     *
     * @param {string|number} uriOrKey - The URI of a Smile ID server or a
     * numeric key that represents it.
     * @returns {string} URI of smile server if in map, original input if URI.
     */
    export function mapServerUri(uriOrKey: string | number): string;
    /** @type {{source_sdk: string, source_sdk_version: string}} */
    export const sdkVersionInfo: {
        source_sdk: string;
        source_sdk_version: string;
    };
    /**
     * Validates that partner params contains required fields.
     *
     * @param {object} partnerParams - required parameters for each job.
     * @param {string} partnerParams.user_id - your unique identifier for the user.
     * @param {string} partnerParams.job_id - your unique identifier for the job.
     * @param {string|number} partnerParams.job_type - type of job.
     * @throws {Error} if partnerParams is not an object or is missing required keys.
     * @returns {void}
     */
    export function validatePartnerParams(partnerParams: {
        user_id: string;
        job_id: string;
        job_type: string | number;
    }): void;
}
declare module "signature" {
    export = Signature;
    class Signature {
        /**
         * Instantiates a new Signature object.
         *
         * @param {string} partnerID - Smile Partner ID. This is a unique identifier
         * for your Smile account.
         * @param {string} apiKey - Smile API Key. Found in the Smile Dashboard.
         */
        constructor(partnerID: string, apiKey: string);
        partnerID: string;
        apiKey: string;
        /**
         * Generates a signature for a given timestamp.
         *
         * @param {string|number|undefined} timestamp - A valid ISO 8601 timestamp or unix time in
         * milliseconds. If undefined, the current time will be used.
         * @returns {{
         *  signature: string,
         *  timestamp: number | string,
         * }} - An object containing the signature and timestamp.
         * @throws {Error} - If the timestamp is invalid.
         */
        generate_signature(timestamp?: string | number | undefined): {
            signature: string;
            timestamp: number | string;
        };
        /**
         * Generates a signature for a given timestamp.
         *
         * @param {string|number} timestamp - A valid ISO 8601 timestamp or unix time in
         * milliseconds. If undefined, the current time will be used.
         * @param {string} signature - A signature received from the server in a previous request
         * @returns {boolean} - An object containing the signature and timestamp.
         * @throws {Error} - If the timestamp is invalid.
         */
        confirm_signature(timestamp: string | number, signature: string): boolean;
    }
}
declare module "id-api" {
    export = IDApi;
    class IDApi {
        /**
       * Creates an instance of WebApi.
       *
       * @param {string} partner_id - Your Smile Partner ID
       * @param {string} api_key - Your Smile API Key
       * @param {string|number} sid_server - The server to use for the SID API. 0 for
       * staging and 1 for production.
       */
        constructor(partner_id: string, api_key: string, sid_server: string | number);
        partner_id: string;
        sid_server: string | number;
        api_key: string;
        url: string;
        /**
         * Submit a job to Smile.
         *
         * @param {{
        *  user_id: string,
        *  job_id: string,
        *  job_type: string|number,
        * }} partner_params - the user_id, job_id, and job_type of the job to submit.
        * Can additionally include optional parameters that Smile will return in the
        * job status.
        * @param {{
        * entered: boolean|string|undefined,
        *  country: string|undefined,
        *  id_type: string|undefined,
        *  id_number: string|undefined,
        *  business_type: string|undefined,
        *  postal_code: string|undefined,
        *  postal_address: string|undefined,
        * }} id_info - ID information required to create a job.
        * @returns {Promise<object>} A promise that resolves to the job status.
        * @throws {Error} If any of the required parameters are missing or if the request fails.
        * @memberof WebApi
        */
        submit_job(partner_params: {
            user_id: string;
            job_id: string;
            job_type: string | number;
        }, id_info: {
            entered: boolean | string | undefined;
            country: string | undefined;
            id_type: string | undefined;
            id_number: string | undefined;
            business_type: string | undefined;
            postal_code: string | undefined;
            postal_address: string | undefined;
        }): Promise<object>;
    }
}
declare module "utilities" {
    export = Utilities;
    class Utilities {
        /**
         *
         * @param {string} partner_id partner id from the portal
         * @param {string} api_key apid key from the portal
         * @param {string|number} sid_server the server to use
         */
        constructor(partner_id: string, api_key: string, sid_server: string | number);
        partnerId: string;
        apiKey: string;
        url: string;
        /**
         *
         * @param {string|number} userId a unique id generated to track the user
         * @param {string|number} jobId a unique id generated to track the job
         * @param {*} options
         * @returns Promise<object>
         */
        get_job_status(userId: string | number, jobId: string | number, options?: any): any;
    }
}
declare module "web-token" {
    /**
     * Gets an authorization token from Smile. Used in Hosted Web Integration.
     *
     * @param {string} partner_id - The partner ID.
     * @param {string} api_key - Your Smile API key.
     * @param {string} url - The URL to the Smile ID API.
     * @param {{
     *  callback_url: string,
     *  user_id: string,
     *  job_id: string,
     *  product: string,
     * }} requestParams - parameters required to get an authorization token.
     * @param {string|undefined} defaultCallback - Your default callback URL.
     * @returns {Promise<{
     *  token: string,
     * }>} - The authorization token.
     * @throws {Error} - if the request fails.
     */
    export function getWebToken(partner_id: string, api_key: string, url: string, requestParams: {
        callback_url: string;
        user_id: string;
        job_id: string;
        product: string;
    }, defaultCallback: string | undefined): Promise<{
        token: string;
    }>;
}
declare module "web-api" {
    export = WebApi;
    class WebApi {
        /**
         * Creates an instance of WebApi.
         *
         * @param {string} partner_id - Your Smile Partner ID
         * @param {string} default_callback - The default callback url to use for all requests.
         * @param {string} api_key - Your Smile API Key
         * @param {string|number} sid_server - The server to use for the SID API. 0 for
         * staging and 1 for production.
         */
        constructor(partner_id: string, default_callback: string, api_key: string, sid_server: string | number);
        partner_id: string;
        default_callback: string;
        api_key: string;
        url: string;
        /**
         * Get the status of an existing job.
         *
         * @param {{
         *  user_id: string,
         *  job_id: string,
         * }} partner_params - the user_id and job_id of the job to check.
         * @param {{
         *  return_history: boolean,
         *  return_images: boolean,
         * }} options - indicates whether to return the history and/or images.
         * @returns {Promise<object>} A promise that resolves to the job status.
         * @throws {Error} If any of the required parameters are missing or if the request fails.
         * @memberof WebApi
         */
        get_job_status(partner_params: {
            user_id: string;
            job_id: string;
        }, options: {
            return_history: boolean;
            return_images: boolean;
        }): Promise<object>;
        /**
         * Get a authorization token for the hosted web integration.
         *
         * @param {{
         *  callback_url: string,
         *  user_id: string,
         *  job_id: string,
         *  product: string,
         * }} requestParams - parameters required to get an authorization token.
         * @returns {Promise<{
         *  token: string,
         * }>} - The authorization token.
         * @throws {Error} If any of the required parameters are missing or if the request fails.
         * @memberof WebApi
         */
        get_web_token(requestParams: {
            callback_url: string;
            user_id: string;
            job_id: string;
            product: string;
        }): Promise<{
            token: string;
        }>;
        /**
         * Submit a job to Smile.
         *
         * @param {{
         *  user_id: string,
         *  job_id: string,
         *  job_type: string|number,
         * }} partner_params - the user_id, job_id, and job_type of the job to submit.
         * Can additionally include optional parameters that Smile will return in the
         * job status.
         * @param {Array<{
         *  image_type_id: string|number,
         *  image: string,
         * }>} image_details - an array of image objects. Each image object must include an image_type_id
         * and an image. See constants.js for a list of valid image_type_ids.
         * @param {{
         *  entered: boolean|string|undefined,
         *  country: string|undefined,
         *  id_type: string|undefined,
         *  id_number: string|undefined,
         * }} id_info - ID information required to create a job.
         * @param {{
         *  optional_callback: string,
         *  return_job_status: boolean,
         *  return_images: boolean,
         *  return_history: boolean,
         *  use_enrolled_image: boolean
         * }} options - options to control the response.
         * @returns {Promise<object>} A promise that resolves to the job status.
         * @throws {Error} If any of the required parameters are missing or if the request fails.
         * @memberof WebApi
         */
        submit_job(partner_params: {
            user_id: string;
            job_id: string;
            job_type: string | number;
        }, image_details: Array<{
            image_type_id: string | number;
            image: string;
        }>, id_info: {
            entered: boolean | string | undefined;
            country: string | undefined;
            id_type: string | undefined;
            id_number: string | undefined;
        }, options?: {
            optional_callback: string;
            return_job_status: boolean;
            return_images: boolean;
            return_history: boolean;
            use_enrolled_image: boolean;
        }): Promise<object>;
    }
}
