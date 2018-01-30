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
 * @param  {string} [$0.clientId]
 * @param  {string} [$0.clientSecret]
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
            properties: {
              name: response.address.ShortLabel,
              county: response.address.Subregion,
              neighbourhood: response.address.Neighborhood,
              region: response.address.Region,
              locality: response.address.city,
              country_a: response.address.CountryCode,
              label: response.address.LongLabel
            },
            type: 'point'
          },
          type: 'feature'
        }],
        query: point
      }
    })
}

export function search ({
  clientId,
  clientSecret,
  boundary,
  focusPoint,
  size = 10,
  text,
  url
}: BaseQuery & {
  boundary?: Boundary,
  focusPoint?: any,
  size?: number,
  text: string,
}): Promise<BaseResponse> {
  return Promise.resolve({ query: text })
}
