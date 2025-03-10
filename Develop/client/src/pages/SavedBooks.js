import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { PROFILE } from '../graphql/queries';
import { DELETE_BOOK } from '../graphql/mutations';
const SavedBooks = () => {
    const { loading, error, data, refetch } = useQuery(PROFILE);
    const [deleteBookMutation] = useMutation(DELETE_BOOK);
    if (loading)
        return <h2>LOADING...</h2>;
    if (error)
        return <h2>Error: {error.message}</h2>;
    const userData = data.profile;
    const handleDeleteBook = async (bookId) => {
        try {
            await deleteBookMutation({ variables: { bookId } });
            refetch();
        }
        catch (err) {
            console.error(err);
        }
    };
    return (<>
      <div className='text-light bg-dark p-5'>
        <Container>
          {userData.username ? (<h1>Viewing {userData.username}'s saved books!</h1>) : (<h1>Viewing saved books!</h1>)}
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {userData.savedBooks.length
            ? `Viewing ${userData.savedBooks.length} saved ${userData.savedBooks.length === 1 ? 'book' : 'books'}:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {userData.savedBooks.map((book) => (<Col md='4' key={book.bookId}>
              <Card border='dark'>
                {book.image && (<Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top'/>)}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button className='btn-block btn-danger' onClick={() => handleDeleteBook(book.bookId)}>
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            </Col>))}
        </Row>
      </Container>
    </>);
};
export default SavedBooks;
