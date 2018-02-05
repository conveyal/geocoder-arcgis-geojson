// @flow

import nock from 'nock'

import {autocomplete, bulk, reverse, search} from '../index'

const mockBulkResult = require('./mock-bulk-result.json')
const mockReverseResult = require('./mock-reverse-result.json')
const mockSearchResult = require('./mock-search-result.json')
const mockSuggestResult = require('./mock-suggest-result.json')

describe('geocoder-arcgis-geojson', () => {
  describe('autocomplete', () => {
    it('should make basic autocomplete query', async () => {
      nock('https://geocode.arcgis.com/')
        .get(/arcgis\/rest\/services\/World\/GeocodeServer\/suggest/)
        .reply(200, (uri, requestBody) => {
          expect(uri).toMatchSnapshot('basic autocomplete request uri')
          return mockSuggestResult
        })

      const result = await autocomplete({
        text: '123 main st'
      })
      expect(result).toMatchSnapshot('basic autocomplete g-a-g response')
    })
  })

  describe('bulk', () => {
    it('should make basic bulk query', async () => {
      // nock for auth token
      nock('https://www.arcgis.com/')
        .post(/sharing\/oauth2\/token/)
        .reply(200, { access_token: 'test', expires_in: 86400 })

      // nock for bulk geocode reqeust
      nock('https://geocode.arcgis.com/')
        .post(/arcgis\/rest\/services\/World\/GeocodeServer\/geocodeAddresses/)
        .reply(200, (uri, requestBody) => {
          expect(uri).toMatchSnapshot('basic bulk request uri')
          return mockBulkResult
        })

      const result = await bulk({
        addresses: ['123 main st'],
        clientId: 'test',
        clientSecret: 'test'
      })
      expect(result).toMatchSnapshot('basic bulk g-a-g response')
    })
  })

  describe('reverse', () => {
    it('should make basic reverse query', async () => {
      nock('https://geocode.arcgis.com/')
        .get(/arcgis\/rest\/services\/World\/GeocodeServer\/reverseGeocode/)
        .reply(200, (uri, requestBody) => {
          expect(uri).toMatchSnapshot('basic reverse request uri')
          return mockReverseResult
        })

      const result = await reverse({
        point: {
          lat: 37.061460,
          lon: -122.006443
        }
      })
      expect(result).toMatchSnapshot('basic reverse g-a-g response')
    })
  })

  describe('search', () => {
    it('should make basic search query', async () => {
      nock('https://geocode.arcgis.com/')
        .get(/arcgis\/rest\/services\/World\/GeocodeServer\/findAddressCandidates/)
        .reply(200, (uri, requestBody) => {
          expect(uri).toMatchSnapshot('basic search request uri')
          return mockSearchResult
        })

      const result = await search({
        text: '123 main st'
      })
      expect(result).toMatchSnapshot('basic search g-a-g response')
    })
  })
})
