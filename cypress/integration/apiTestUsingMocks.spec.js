/// <reference types="cypress" />

describe('test with backend', () => {
    beforeEach('Login to app', () => {
        cy.server()
        cy.loginToApplication()
    })

    it('verify correct request and response', () => {

        cy.route('POST', '**/articles').as('postArticles')

        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('This is a title')
        cy.get('[formcontrolname="description"]').type('This is a description')
        cy.get('[formcontrolname="body"]').type('This is the body of the article')
        cy.get('[placeholder="Enter tags"]').type('tag1')
        cy.contains('Publish Article').click()

        cy.wait('@postArticles')
        cy.get('@postArticles').then(xhr => {

            expect(xhr.status).to.equal(200)

            expect(xhr.request.body.article.title).to.equal('This is a title')
            expect(xhr.response.body.article.title).to.equal('This is a title')

            expect(xhr.request.body.article.description).to.equal('This is a description')
            expect(xhr.response.body.article.description).to.equal('This is a description')

            expect(xhr.request.body.article.body).to.equal('This is the body of the article')
            expect(xhr.response.body.article.body).to.equal('This is the body of the article')
        })
    })

    it('should check tags returned from JSON', () => {
        cy.route('GET', '**/tags', 'fixture:tags.json')

        cy.get('.tag-list')
            .should('contain', 'cypress')
            .and('contain', 'automation')
            .and('contain', 'testing')
    })

    it('verify global feed likes count', () => {
        cy.route('GET', '**/articles/feed*', '{"articles":[],"articlesCount":0}')
        cy.route('GET', '**/articles*', 'fixture:articles.json')

        cy.contains('Global Feed').click()
        cy.get('app-article-list button').then(listOfButtons => {
            expect(listOfButtons[0]).to.contain('1')
            expect(listOfButtons[1]).to.contain('5')

        })

        cy.fixture('articles').then(file => {
            const articleLink = file.articles[1].slug
            cy.route('POST', '**/articles/' + articleLink + '/favorite', file)
        })

        cy.get('app-article-list button')
            .eq(1)
            .click()
            .should('contain', '6')
    })

    it('delet a new article', () => {

        const bodyRequest = {
            "article": {
                "tagList": [],
                "title": "Request from API",
                "description": "API testing - description",
                "body": "API testing - body"
            }
        }

        cy.get('@token').then(token => {

            cy.request({
                url: Cypress.env('apiUrl') + 'api/articles/',
                headers: { 'Authorization': 'Token ' + token },
                method: 'POST',
                body: bodyRequest
            }).then(response => {
                expect(response.status).to.equal(200)
            })

            cy.contains('Global Feed').click()
            cy.get('.article-preview').first().click()
            cy.get('.article-actions').contains('Delete Article').click()

            cy.request({
                url: Cypress.env('apiUrl') + 'api/articles?limit=10&offset=0',
                headers: { 'Authorization': 'Token ' + token },
                method: 'GET',
            }).its('body').then(body => {
                expect(body.articles[0].title).not.to.equal(bodyRequest.article.title)
            })

        })
    })
})