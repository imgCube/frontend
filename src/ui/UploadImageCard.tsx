import { Button, Card, CardActions, CardContent, CardMedia, FormControl, InputLabel, MenuItem, Select, TextField, Theme, Typography } from 'material-ui'
import * as React from 'react'
import { CSSProperties } from 'material-ui/styles/withStyles'
import { categories } from '../models/categories'
import EditableText from './EditableText'
import { WithStyles, withStyles } from './withStyles'
import { UploadImage } from '../models/UploadImage'
import { DEFAULT_AUTHOR } from '../routes/UploadImagePage'
import { calculateImagePrice, getImageData } from '../models/Image'
import BigNumber from 'bignumber.js'

const styles = (theme: Theme) => ({
  categoryPicker: {
    width: '100%',
    marginTop: theme.spacing.unit
  },
  card: {
    width: 345, // TODO: Make the cards responsive (like a card row), but they cannot rescale by changing their description / name.
    float: 'left',
    margin: '20px 20px 20px 0px'
  } as CSSProperties,
  media: {
    height: 0,
    paddingTop: '56.25%'
  },
  textField: {
    width: '100%'
  },
  priceText: {
    marginLeft: 'auto',
    textAlign: 'end',
    paddingRight: '12px'
  } as CSSProperties
})

type UploadedImageCardProps = WithStyles & {
  fileData: UploadImage,
  index: number,
  removeFileCallback: (index: number) => void
}

@withStyles(styles)
export default class UploadImageCard extends React.Component<UploadedImageCardProps, {
  file: UploadImage,
  price: BigNumber,
  usdPrice: BigNumber
}> {
  state = {
    file: this.props.fileData,
    price: null,
    usdPrice: null
  }

  constructor(props: UploadedImageCardProps) {
    super(props)
  }

  async componentWillMount() {
    const data = await getImageData(this.props.fileData)

    fetch('https://api.coinmarketcap.com/v2/ticker/1908/').then((response: any) => {
      response.json().then((ticker) => {
        const nasPrice = new BigNumber(calculateImagePrice(data).toString().substring(17, 0))

        this.setState({
          price: nasPrice,
          usdPrice: new BigNumber(new BigNumber(ticker.data.quotes.USD.price).multipliedBy(nasPrice) .toString().substring(6, 0))
        })
      })
    })

    this.state.file.category = 'Other'
  }

  updateCategory(event: React.ChangeEvent<HTMLSelectElement>) {
    const file = this.state.file

    file.category = event.target.value

    this.setState({
      file
    })
  }

  updateName(index: number, newName: string) {
    const { file } = this.state

    file.name = newName

    this.setState({
      file
    })
  }

  updateAuthor(event: React.ChangeEvent<HTMLInputElement>) {
    const { file } = this.state

    file.author = event.target.value

    this.setState({
      file
    })
  }

  shouldComponentUpdate(nextProps: UploadedImageCardProps) {
    if (nextProps.fileData !== this.props.fileData) {
      this.state.file = nextProps.fileData
    }

    return true
  }

  render() {
    const file = this.state.file
    const index = this.props.index
    const classes = this.props.classes
    return (
      <Card className={classes.card} key={index}>
        <CardMedia className={classes.media} image={file.preview} title={file.name}/>
        <CardContent>
          <EditableText defaultValue={file.name} typographyVariant={'headline'} onValueApplied={(value) => this.updateName(index, value)}/>
          <TextField id='with-placeholder' label='Image author' placeholder={DEFAULT_AUTHOR} className={classes.textField} value={this.state.file.author} onChange={(event) => this.updateAuthor(event)} margin='normal'/>
          <FormControl className={this.props.classes.categoryPicker}>
            <InputLabel htmlFor='categoryPicker'>Category</InputLabel>
            <Select name={file.name} value={this.state.file.category} onChange={(event) => this.updateCategory(event)} inputProps={{
              id: 'categoryPicker'
            }}>
              {categories.slice(1).map((category: string, categoryIndex: number) => (
                <MenuItem value={category} key={categoryIndex}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
        <CardActions>
          <Button size='small' color='secondary' onClick={() => this.props.removeFileCallback(index)}>
            Delete
          </Button>
          <Button size='small' color='primary'>
            Upload
          </Button>
          {this.state.price && this.state.usdPrice && <Typography className={classes.priceText}>{this.state.price.toString()} NAS (~{this.state.usdPrice.toString()} USD)</Typography>}
        </CardActions>
      </Card>
    )
  }
}