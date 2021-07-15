declare class ArcGISAuth {
  constructor(options?: Record<string, unknown>)
  options: Record<string, unknown>
  authendpoint: string
  cache: Record<string, unknown>
  putToken(token: string, experation: string): void
  getToken(): string
  /**
   *  Authenticate with OAuth
   *  @return token OAuth token
   */
  auth(): string
}

/**
 * Promises based node.js wrapper for the ESRI ArcGIS geocoder
 *
 * @param options Add client_id, client_secret to get token from ArcGIS auth
 * @return Instance of {@link GeocoderArcGIS}
 */
declare class GeocoderArcGIS {
  constructor(options?: Record<string, unknown>)
  options: Record<string, unknown>
  endpoint: string
  cache: Record<string, unknown>
  arcgisauth: ArcGISAuth
  /**
   *  Geocode a string or object
   *
   *  @param  data        string to be geocoded
   *  @params {params}    optional parameters
   *  @return Promise
   */
  findAddressCandidates(
    data: string,
    params?: Record<string, unknown>
  ): Promise<Array<string>>

  /**
   *  Geocode a string: Deprecated
   *  For backwards compatibility only!
   *
   *  @param  data        string to be geocoded
   *  @params {params}    optional parameters
   *  @return Promise
   */
  geocode(data: string, params?: Record<string, unknown>): Promise<unknown>
  /**
   *  Reverse geocode a LatLng
   *
   *  @param  data      string to be reverse geocoded 'lat,lng'
   *  @params {params}    optional parameters
   *  @return Promise
   */
  reverse(data: string, params?: Record<string, unknown>): Promise<unknown>
  /**
   *  Make suggestion for a string
   *
   *  @param  data        string to be geocoded
   *  @params {params}    optional parameters
   *  @return Promise
   */
  suggest(data: string, params?: Record<string, unknown>): Promise<unknown>
  /**
   *  Batch geocoding an array of addresses
   *
   *  @param  [data]      array of addresses
   *  @params {params}    optional parameters
   *  @return Promise
   */
  geocodeAddresses(
    data?: string[],
    params?: Record<string, unknown>
  ): Promise<unknown>

  /**
   *  Generate the query for specific method
   */
  _getQuery(
    method: string,
    data: string,
    params: Record<string, unknown>
  ): unknown

  /**
   *  Prepare the query for find
   */
  _getQueryGeocode(
    data: string,
    params: Record<string, unknown>
  ): {
    text: string
    outFields: string
    maxLocations: number
  }

  /**
   *  Prepare the query for reverse
   */
  _getQueryReverse(
    data: string,
    params: Record<string, unknown>
  ):
    | {
        error: string
        location?: undefined
        maxLocations?: undefined
      }
    | {
        location: unknown
        maxLocations: number
        error?: unknown
      }

  /**
   *  Prepare the query for suggest
   */
  _getQuerySuggest(
    data: string,
    params: Record<string, unknown>
  ): {
    text: string
    outFields: unknown
    maxSuggestions: number
  }

  /**
   *  Prepare the query for findAddressCandidates
   */
  _getQueryFindAddressCandidates(data: unknown): unknown
  /**
   *  Prepare the query for geocodeAddresses
   */
  _getQueryGeocodeAddresses(data: unknown): {
    addresses: {
      records: unknown[]
    }
  }

  /**
   *  Call the API w/out authentication
   *
   *  @param  method    service method
   *  @param  data      data
   *  @params params    optional parameters
   *  @return promise
   */
  _run(
    method: unknown,
    data: string,
    params: Record<string, unknown>
  ): Promise<unknown>

  /**
   *  Call the API w/ authentication
   *
   *  @param  method    service method
   *  @param  data      data
   *  @params params    optional parameters
   *  @return promise
   */
  _runAuth(
    method: unknown,
    data: string,
    params: Record<string, unknown>
  ): Promise<unknown>

  /**
   * Sends a given request as a JSON object to the ArcGIS API and returns
   * a promise which if resolved will contain the resulting JSON object.
   *
   * @param  {[type]}   endpoint    ArcGIS API endpoint to call
   * @param  {[type]}   params      Object containg parameters to call the API with
   * @param  {Function} Promise
   */
  _execute(endpoint: string[], method: unknown[], query: unknown): unknown
  getQueryString(params: string[]): string
  /**
   *   Parsing error and return error object
   */
  parseError(error: unknown): Error
  /**
   *  Validations
   */
  validateLngLat(lnglat: unknown): boolean
}
