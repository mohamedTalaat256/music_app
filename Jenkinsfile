pipeline {
    agent any

    stages {

        stage('Build') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                }
            }
            steps {
              sh '''
                ls -la
                node --version
                ng build --configuration production --base-href ./
                ls -la dist
              '''
            }
        }
    }
}
