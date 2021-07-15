import GeocoderArcGIS from 'geocoder-arcgis'
import type { GeoJSON } from 'geojson'
import { toCoordinates, toString, toPoint } from '@conveyal/lonlat'
import type { LonLatInput } from '@conveyal/lonlat'

type Point = {
  x: number
  y: number
}

type GeocodersList = {
  [key: string]: GeocoderArcGIS
}

type Boundary = {
  rect: {
    minLat: number
    minLon: number
    maxLat: number
    maxLon: number
  }
}

type Candidate = {
  location: LonLatInput
  attributes: Record<string, string | number>
}

type Options = {
  searchExtent?: string
  location?: string
  forStorage?: boolean
  outFields?: string
  magicKey?: string
  size?: number
}

type BaseQuery = {
  boundary?: Boundary
  clientId?: string
  clientSecret?: string
  focusPoint?: Point
  text?: string
  url?: string
}

type GeocoderResponse = {
  suggestions?: string[]
  locations?: Candidate[]
  location?: LonLatInput
  address?: Record<string, string>
  candidates?: Candidate[]
}

type BaseResponse = GeoJSON.FeatureCollection

const arcGisGeocoders: GeocodersList = {}

function boundaryToSearchExtent(boundary: Boundary): string {
  return [
    boundary.rect.minLon,
    boundary.rect.maxLat,
    boundary.rect.maxLon,
    boundary.rect.minLat
  ].join(',')
}

function getGeocoder(
  clientId?: string,
  clientSecret?: string,
  endpoint?: string
): GeocoderArcGIS {
  const geocoderKey: string = [clientId, clientSecret, endpoint]
    .map((s) => String(s))
    .join('-')

  if (!arcGisGeocoders[geocoderKey]) {
    arcGisGeocoders[geocoderKey] = new GeocoderArcGIS({
      client_id: clientId,
      client_secret: clientSecret,
      endpoint
    })
  }

  return arcGisGeocoders[geocoderKey]
}

/**
 * Translate arcgis candidate json to geojson
 */
function candidateToGeojson(candidate: Candidate): GeoJSON {
  if (!candidate.location) {
    // no result found for this candidate
    return {
      geometry: {
        coordinates: [0, 0],
        type: 'Point'
      },
      properties: {
        confidence: 0,
        country: '',
        country_a: '',
        county: '',
        label: 'Address not found',
        locality: '',
        name: '',
        neighbourhood: '',
        region: '',
        resultId: candidate.attributes.ResultID // this only appears in bulk geocode results
      },
      type: 'Feature'
    }
  }

  if (typeof candidate.attributes.Score !== 'number') {
    candidate.attributes.Score = parseInt(candidate.attributes.Score)
  }

  return {
    geometry: {
      coordinates: toCoordinates(candidate.location),
      type: 'Point'
    },
    properties: {
      confidence: candidate.attributes.Score / 100,
      country: candidate.attributes.Country,
      country_a: candidate.attributes.Country,
      county: candidate.attributes.Subregion,
      label: candidate.attributes.LongLabel,
      locality: candidate.attributes.City,
      name: candidate.attributes.ShortLabel,
      neighbourhood: candidate.attributes.Nbrhd,
      region: candidate.attributes.Region,
      resultId: candidate.attributes.ResultID // this only appears in bulk geocode results
    },
    type: 'Feature'
  }
}

/**
 * Search for and address using
 * ESRI's {@link https://developers.arcgis.com/rest/geocode/api-reference/geocoding-suggest.htm|suggest}
 * service.  This service does not return geojson, instead it returns the list
 * of address suggestions and corresponding magicKeys
 *
 * @param {Object} $0
 * @param  {string} [$0.clientId]
 * @param  {string} [$0.clientSecret]
 * @param  {Object} [$0.boundary]
 * @param  {Object} [$0.focusPoint]
 * @param  {string} $0.text                       query text
 * @param {string} [$0.url]                       optional URL to override ESRI suggest endpoint
 * @return {Promise}                              A Promise that'll get resolved with the suggest result
 */
export function autocomplete({
  boundary,
  clientId,
  clientSecret,
  focusPoint,
  text,
  url
}: BaseQuery & Options): Promise<BaseResponse> {
  const geocoder: GeocoderArcGIS = getGeocoder(clientId, clientSecret, url)
  const options: Options = {}

  if (focusPoint) {
    options.location = toString(focusPoint)
  }

  if (boundary) {
    options.searchExtent = boundaryToSearchExtent(boundary)
  }

  // make request to arcgis
  return geocoder.suggest(text, options).then((response: GeocoderResponse) => {
    // translate response
    return {
      features: response.suggestions,
      query: {
        text
      }
    }
  })
}

/**
 * Bulk geocode a list of addresses using
 * ESRI's {@link https://developers.arcgis.com/rest/geocode/api-reference/geocoding-geocode-addresses.htm|geocodeAddresses}
 * service.
 *
 * @param {Object} $0
 * @param  {Array} $0.addresses     Can be array of strings or objects.  Strings can be addresses or coordinates in the form `lon,lat`
 * @param  {string} $0.clientId
 * @param  {string} $0.clientSecret
 * @param  {Object} [$0.boundary]
 * @param  {Object} [$0.focusPoint]
 * @param  {string} [$0.url]
 * @return {Promise}                A Promise that'll get resolved with the bulk geocode result
 */
export function bulk({
  addresses,
  boundary,
  clientId,
  clientSecret,
  focusPoint,
  url
}: BaseQuery & Options & { addresses: Array<string> }): Promise<
  BaseResponse[]
> {
  const geocoder: GeocoderArcGIS = getGeocoder(clientId, clientSecret, url)
  let addressesQuery: Array<string | Options> = [...addresses]
  const options: Options = {}

  if (boundary || focusPoint) {
    const addressOptions: Options = {}

    if (boundary) {
      addressOptions.searchExtent = boundaryToSearchExtent(boundary)
    }

    if (focusPoint) {
      addressOptions.location = toString(focusPoint)
    }

    addressesQuery = addresses.map((address: unknown): Options => {
      // add in searchExtent and/or location to each address query
      if (typeof address === 'string') {
        address = {
          address
        }
      }

      return Object.assign({}, addressOptions, address)
    })
  }

  // make request to arcgis
  return geocoder
    .geocodeAddresses(addressesQuery, options)
    .then((response: GeocoderResponse) => {
      // translate response
      // ArcGIS returns only a single response for reverse geocoding
      return {
        features: response.locations.map(candidateToGeojson),
        query: {
          addresses: addressesQuery
        }
      }
    })
}

/**
 * Reverse geocode using
 * ESRI's {@link https://developers.arcgis.com/rest/geocode/api-reference/geocoding-reverse-geocode.htm|reverseGeocode}
 * service.
 *
 * @param {Object} $0
 * @param {string} [$0.clientId]
 * @param {string} [$0.clientSecret]
 * @param {boolean} [$0.forStorage=false]        Specifies whether result is inteded to be stored
 * @param {{lat: number, lon: number}} $0.point Point to reverse geocode
 * @param {string} [$0.url]                     optional URL to override ESRI reverseGeocode endpoint
 * @return {Promise}                            A Promise that'll get resolved with reverse geocode result
 */
export function reverse({
  clientId,
  clientSecret,
  forStorage = false,
  point,
  url
}: BaseQuery &
  Options & {
    point: LonLatInput
  }): Promise<BaseResponse> {
  const geocoder = getGeocoder(clientId, clientSecret, url)
  const options: Options = {}
  if (forStorage) {
    options.forStorage = true
  }

  // make request to arcgis
  return geocoder
    .reverse(toString(point), options)
    .then((response: GeocoderResponse): GeoJSON | { query: Point } => {
      // translate response
      // ArcGIS returns only a single response for reverse geocoding
      return {
        features: [
          {
            geometry: {
              coordinates: toCoordinates(response.location),
              type: 'Point'
            },
            properties: {
              country_a: response.address.CountryCode,
              county: response.address.Subregion,
              label: response.address.LongLabel,
              locality: response.address.city,
              name: response.address.ShortLabel,
              neighbourhood: response.address.Neighborhood,
              region: response.address.Region
            },
            type: 'Feature'
          }
        ],
        query: toPoint(point)
      }
    })
}

/**
 * Search for an address using
 * ESRI's {@link https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm|findAddressCandidates}
 * service.
 *
 * @param {Object} $0
 * @param {string} [$0.clientId]
 * @param {string} [$0.clientSecret]
 * @param  {Object} [$0.boundary]
 * @param  {Object} [$0.focusPoint]
 * @param {boolean} [$0.forStorage=false]       Specifies whether result is inteded to be stored
 * @param {string} [$0.magicKey]                magicKey to use in searching as obtained from `suggest` results
 * @param {number} [$0.size=10]
 * @param {string} $0.text                      The address text to query for
 * @param {string} [$0.url]                     optional URL to override ESRI reverseGeocode endpoint
 * @return {Promise}                            A Promise that'll get resolved with search result
 */
export function search({
  boundary,
  clientId,
  clientSecret,
  focusPoint,
  forStorage = false,
  magicKey,
  size = 10,
  text,
  url
}: BaseQuery & Options): Promise<BaseResponse> {
  const geocoder: GeocoderArcGIS = getGeocoder(clientId, clientSecret, url)
  const options: Options & { maxLocations?: number } = {}
  options.outFields = '*'

  if (boundary) {
    options.searchExtent = boundaryToSearchExtent(boundary)
  }

  if (focusPoint) {
    options.location = toString(focusPoint)
  }

  if (forStorage) {
    options.forStorage = true
  }

  if (magicKey) {
    options.magicKey = magicKey
  }

  if (size) {
    options.maxLocations = size
  }

  // make request to arcgis
  return geocoder
    .findAddressCandidates(text, options)
    .then((response: GeocoderResponse) => {
      // translate response
      // ArcGIS returns only a single response for reverse geocoding
      return {
        features: response.candidates.map(candidateToGeojson),
        query: {
          text
        }
      }
    })
}
