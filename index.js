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
  isomorphicMapzenSearchQuery: {}
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
 * service.
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
        features: response.suggestions
      }
    })
}

export function reverse ({
  clientId,
  clientSecret,
  point,
  url
}: BaseQuery & {
  point: any
}) {

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
}) {

}
