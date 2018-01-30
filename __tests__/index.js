// @flow

import nock from 'nock'

import {autocomplete} from '../index'

const mockSuggestResult = require('./mock-suggest-result.json')

describe('geocoder-arcgis-geojson', () => {
  describe('autocomplete', () => {
    it('should make basic autocomplete query', async () => {
      nock('https://geocode.arcgis.com/')
        .get(/arcgis\/rest\/services\/World\/GeocodeServer\/suggest/)
        .reply(200, (uri, requestBody) => {
          expect(uri).toMatchSnapshot('request uri')
          return mockSuggestResult
        })

      const result = await autocomplete({
        text: '123 main st'
      })
      expect(result).toMatchSnapshot('g-a-g response')
    })
  })
})
