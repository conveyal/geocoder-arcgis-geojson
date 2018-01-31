// @flow

import GeocoderArcGIS from 'geocoder-arcgis'
import lonlat from '@conveyal/lonlat'

let arcGisGeocoder

type Boundary = {
  rect: {
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number
  }
}

type BaseQuery = {
  clientId?: string,
  clientSecret?: string,
  url?: string
}

type BaseResponse = {
  query: any
}

function boundaryToSearchExtent (boundary: Boundary): string {
  return [
    boundary.rect.minLon,
    boundary.rect.maxLat,
    boundary.rect.maxLon,
    boundary.rect.minLat
  ].join(',')
}

function getGeocoder (clientId: ?string, clientSecret: ?string, endpoint: ?string) {
  // assume same clientId/clientSecret is used each time
  if (!arcGisGeocoder) {
    arcGisGeocoder = new GeocoderArcGIS({
      client_id: clientId,
      client_secret: clientSecret,
      endpoint
    })
  }

  return arcGisGeocoder
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
export function autocomplete ({
  clientId,
  clientSecret,
  boundary,
  focusPoint,
  text,
  url
}: BaseQuery & {
  boundary?: Boundary,
  focusPoint?: any,
  text: string,
}): Promise<BaseResponse> {
  const geocoder = getGeocoder(clientId, clientSecret, url)
  const options = {}

  if (focusPoint) {
    options.location = lonlat.toString(focusPoint)
  }

  if (boundary) {
    options.searchExtent = boundaryToSearchExtent(boundary)
  }

  // make request to arcgis
  return geocoder.suggest(text, options)
    .then(response => {
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
export function reverse ({
  clientId,
  clientSecret,
  forStorage = false,
  point,
  url
}: BaseQuery & {
  forStorage?: boolean,
  point: any
}): Promise<BaseResponse> {
  const geocoder = getGeocoder(clientId, clientSecret, url)
  const options = {}
  if (forStorage) {
    options.forStorage = true
  }

  // make request to arcgis
  return geocoder.reverse(lonlat.toString(point), options)
    .then(response => {
      // translate response
      // ArcGIS returns only a single response for reverse geocoding
      return {
        features: [{
          geometry: {
            coordinates: [
              response.location.y,
              response.location.x
            ],
            type: 'point'
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
          type: 'feature'
        }],
        query: point
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
export function search ({
  clientId,
  clientSecret,
  boundary,
  focusPoint,
  forStorage = false,
  magicKey,
  size = 10,
  text,
  url
}: BaseQuery & {
  boundary?: Boundary,
  focusPoint?: any,
  forStorage?: boolean,
  magicKey?: string,
  size?: number,
  text: string,
}): Promise<BaseResponse> {
  const geocoder = getGeocoder(clientId, clientSecret, url)
  const options = {}
  options.outFields = '*'

  if (boundary) {
    options.searchExtent = boundaryToSearchExtent(boundary)
  }

  if (focusPoint) {
    options.location = lonlat.toString(focusPoint)
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
  return geocoder.findAddressCandidates(text, options)
    .then(response => {
      // translate response
      // ArcGIS returns only a single response for reverse geocoding
      return {
        features: response.candidates.map(candidate => {
          return {
            geometry: {
              coordinates: [
                candidate.location.y,
                candidate.location.x
              ],
              type: 'point'
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
              region: candidate.attributes.Region
            },
            type: 'feature'
          }
        }),
        query: {
          text
        }
      }
    })
}
